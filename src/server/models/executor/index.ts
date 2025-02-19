import { gzip, ungzip } from 'node-gzip';
import { from } from 'rxjs';
import rfdc from 'rfdc';
import _ from 'lodash';

import type { Expectation, IExpectationSchemaForward } from '../../../expectations';

import { ExecutorManualError } from './errors';
import { cast, wait } from '../../../utils';
import { Logger } from '../../../logger';
import {
  parsePayload,
  RequestContext,
  serializePayload,
  extractPayloadType,
  IRequestContextCache,
  IRequestContextOutgoing,
  IRequestContextIncoming,
  IRequestContextForwarded,
} from '../request-context';

export * from './errors';

const clone = rfdc();
const logger = Logger.build('Server.Models.Executor');

export abstract class Executor<TRequestContext extends RequestContext = RequestContext> {
  public TRequestContext!: TRequestContext;
  public TContext!: TRequestContext['TContext'];

  /**
   * Uses to handle a request flow when expectation is matched or not
   */
  public abstract handleExpectationMatch(
    context: TRequestContext,
    expectation: Expectation<any> | null
  ): Promise<unknown>;

  /**
   * Uses to handle request forwarding
   */
  public abstract forward(
    context: TRequestContext,
    incoming: IRequestContextIncoming,
    configuration: IExpectationSchemaForward,
  ): Promise<IRequestContextForwarded | null>;

  /**
   * Uses to handle outgoing payload and reply
   */
  public abstract reply(
    context: TRequestContext,
    outgoing: IRequestContextOutgoing
  ): Promise<IRequestContextOutgoing | null>;

  /**
   * Uses to handle whole request
   */
  public async exec(context: TRequestContext): Promise<TRequestContext> {
    const expectation = await this.matchExpectation(context).catch((error) => {
      logger.error('Got error while execution [matchExpectation] method', error?.stack ?? error);
      return null;
    });

    if (!expectation) {
      await this.handleExpectationMatch(context, null).catch((error) => logger.error(
        'Got error while execution [handleAfterExpectationMatch] method',
        error?.stack ?? error
      ));

      if (!context.outgoing) {
        context.provider.storages.history.unregister(context.history);
        return context;
      }

      if (context.history?.hasStatus('registred')) {
        context.history.switchStatus('pending');
      }

      return context;
    }

    if (context.history?.hasStatus('registred')) {
      context.history
        .switchStatus('pending')
        .actualizeSnapshot(context.snapshot)
        .assign({ expectation: context.expectation });

      context.provider.exchanges.io.publish('history:added', context.history.toPlain());
    }

    await this.handleExpectationMatch(context, expectation).catch((error) => logger.error(
      'Got error while execution [handleAfterExpectationMatch] method',
      error?.stack ?? error
    ));

    if (!context.hasStatus('handling')) {
      return context;
    }

    if (context.snapshot.incoming.delay) {
      logger.info(`Has delayed over [${context.snapshot.incoming.delay}ms]`);
      await wait(context.snapshot.incoming.delay);
    }

    if (context.snapshot.incoming.error) {
      logger.info(`Has destroyed using [${context.snapshot.incoming.error}]`);

      context.snapshot.assign({ error: { code: context.snapshot.incoming.error, isManual: true } });
      throw ExecutorManualError.build(context.snapshot.incoming.error);
    }

    if (expectation.forward) {
      const forwarded = await this.handleForwarding(context).catch((error) => {
        logger.error('Got error while execution [handleForwarding] method', error?.stack ?? error);
        return null;
      });

      if (forwarded) {
        context.snapshot.assign({
          outgoing: forwarded.outgoing ?? context.snapshot.outgoing,

          forwarded: {
            isCached: forwarded.isCached,
            messages: clone(forwarded.messages),

            incoming: Object.assign(
              clone(_.omit(forwarded.incoming, ['stream'])),
              _.pick(forwarded.incoming, ['stream'])
            ),

            ...(forwarded.outgoing && {
              outgoing: Object.assign(
                clone(_.omit(forwarded.outgoing, ['stream'])),
                _.pick(forwarded.outgoing, ['stream'])
              ),
            }),
          }
        });
      }

      if (context.snapshot.forwarded && context.history?.hasStatus('pending')) {
        context.history.snapshot.assign({
          cache: context.snapshot.cache,

          forwarded: {
            isCached: context.snapshot.forwarded.isCached,
            incoming: _.omit(context.snapshot.forwarded.incoming, ['stream']),

            ...(context.snapshot.forwarded.outgoing && {
              outgoing: _.omit(context.snapshot.forwarded.outgoing, ['stream'])
            }),
          },
        });

        context.provider.exchanges.io.publish('history:updated', context.history.toPlain());
      }
    }

    if (!context.hasStatus('handling')) {
      return context;
    }

    const outgoing = await this.handleReplying(context).catch((error) => {
      logger.error('Got error while execution [handleReplying] method', error?.stack ?? error);
      return null;
    });

    return outgoing ? context.assign({ outgoing }) : context;
  }

  private async matchExpectation(context: TRequestContext): Promise<Expectation<any> | null> {
    const expectation = context.provider.storages.expectations.match(context.snapshot);
    if (!expectation) {
      return null;
    }

    logger.info('Expectation has matched as', `"${expectation.name}" [${expectation.id}]`);

    context.assign({
      snapshot: expectation.request.manipulate(context.snapshot),
      expectation: expectation.increaseExecutionsCounter(),
    });

    context.provider.exchanges.io.publish('expectation:updated', expectation.toPlain());
    return expectation;
  }

  private async handleForwarding(context: TRequestContext): Promise<IRequestContextForwarded | null> {
    if (!context.expectation?.forward) {
      return context.snapshot;
    }

    const snapshot = context.snapshot.assign({ cache: context.compileCacheConfiguration() });

    if (snapshot.cache.isEnabled) {
      const cached = await context.provider.databases.redis!.get(snapshot.cache.key).catch((error) => {
        logger.error('Got error while redis get', error?.stack ?? error);
        return null;
      });

      const unziped = cached
        ? await ungzip(Buffer.from(cached, 'base64')).catch((error) => {
          logger.error('Got error while cache unzip', error?.stack ?? error);
          return null;
        })
        : null;

      const parsed = <IRequestContextCache | null>(unziped ? parsePayload('json', unziped) : null);

      if (parsed) {
        logger.info(`Got cache [${snapshot.cache.key}]`);

        if (parsed.messages?.length) {
          parsed.outgoing.stream = from(parsed.messages.map((message) => message.data) ?? []);
        }

        return Object.assign(snapshot.pick(['incoming']), parsed, {
          isCached: true,
          outgoing: Object.assign(parsed.outgoing, {
            ...(parsed.outgoing.dataRaw && { dataRaw: Buffer.from(parsed.outgoing.dataRaw, 'base64') }),
          }),
        });
      }
    }

    const type = extractPayloadType(snapshot.incoming.headers) ?? 'plain';
    const dataRaw = snapshot.incoming.data === undefined
      ? snapshot.incoming.dataRaw
      : typeof snapshot.incoming.data === 'object'
        ? serializePayload(type, snapshot.incoming.data)
        : Buffer.from(String(snapshot.incoming.data));

    const forwarded = await this
      .forward(context, Object.assign(snapshot.incoming, { type, dataRaw }), context.expectation.forward)
      .catch((error) => {
        logger.error('Got error while execution [forward] method', error?.stack ?? error);
        return null;
      });

    if (forwarded) {
      forwarded.messages = [];
      forwarded.outgoing?.stream?.subscribe({
        error: () => null,
        next: (data) => forwarded.messages!.push({ data, location: 'outgoing' }),
      });
    }

    return forwarded;
  }

  private async handleReplying(context: TRequestContext): Promise<IRequestContextOutgoing | null> {
    const snapshot = context.expectation?.response
      ? context.expectation.response.manipulate(context.snapshot)
      : context.snapshot;

    const type = extractPayloadType(snapshot.outgoing.headers) ?? snapshot.outgoing.type;
    const dataRaw = snapshot.outgoing.data === undefined
      ? snapshot.outgoing.dataRaw
      : typeof snapshot.outgoing.data === 'object'
        ? serializePayload(type, snapshot.outgoing.data)
        : Buffer.from(String(snapshot.outgoing.data));

    const outgoing = await this
      .reply(context, Object.assign(snapshot.outgoing, { type, dataRaw }))
      .catch((error) => {
        logger.error('Got error while execution [reply] method', error?.stack ?? error);
        return null;
      });

    const shouldBeCached = snapshot.cache.isEnabled
      && snapshot.forwarded?.outgoing
      && !snapshot.forwarded.isCached
      && snapshot.cache.ttl
      && typeof snapshot.cache.key === 'string';

    if (shouldBeCached) {
      const serialized = serializePayload('json', cast<IRequestContextCache>({
        messages: snapshot.forwarded!.messages?.filter((message) => message.location === 'outgoing'),
        outgoing: Object.assign(_.omit(snapshot.forwarded!.outgoing, ['dataRaw']), {
          dataRaw: snapshot.forwarded!.outgoing?.dataRaw?.toString('base64'),
        }),
      }));

      if (!serialized) {
        return outgoing;
      }

      const zipped = await gzip(serialized).catch((error) => {
        logger.error('Got error while zip payload', error?.stack ?? error);
        return null;
      });

      if (zipped) {
        await context.provider.databases.redis!.setex(
          <string>snapshot.cache.key,
          snapshot.cache.ttl!,
          zipped.toString('base64')
        )
          .then(() => logger.info(`Wrote cache [${snapshot.cache.key}] for [${snapshot.cache.ttl}] seconds`))
          .catch((error) => logger.error('Got error while redis set', error?.stack ?? error));
      }
    }

    return outgoing;
  }
}
