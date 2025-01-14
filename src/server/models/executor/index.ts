import { gzip, ungzip } from 'node-gzip';
import { from } from 'rxjs';
import rfdc from 'rfdc';
import _ from 'lodash';

import type { Expectation, IExpectationSchemaForward } from '../../../expectations';

import { ExecutorManualError } from './errors';
import { Logger } from '../../../logger';
import { wait } from '../../../utils';
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

      context.snapshot.assign({ forwarded: forwarded ?? undefined });

      if (forwarded && context.history?.hasStatus('pending')) {
        context.history.snapshot.assign({
          cache: context.snapshot.cache,

          forwarded: {
            isCached: forwarded.isCached,
            incoming: clone(_.omit(forwarded.incoming, ['stream'])),

            ...(forwarded.outgoing && { outgoing: clone(_.omit(forwarded.outgoing, ['stream'])) }),
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

      const parsed = <IRequestContextCache | null>(unziped ? parsePayload('json', unziped.toString()) : null);

      if (parsed) {
        logger.info(`Got cache [${snapshot.cache.key}]`);

        parsed.outgoing.stream = from(parsed.messages?.map((message) => message.data) ?? []);
        return Object.assign(snapshot.pick(['incoming']), parsed, { isCached: true });
      }
    }

    const type = extractPayloadType(snapshot.incoming.headers) ?? 'plain';

    const data = snapshot.incoming.data === undefined ? snapshot.incoming.dataRaw : snapshot.incoming.data;
    const dataRaw = data === undefined ? undefined : typeof data === 'object' ? serializePayload(type, data) : String(data);

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
    const provided = context.snapshot.forwarded?.outgoing
      ? context.snapshot.forwarded.outgoing
      : context.snapshot.outgoing;

    const snapshot = context.expectation?.response
      ? context.expectation.response.manipulate(context.snapshot.assign({ outgoing: provided }))
      : context.snapshot.assign({ outgoing: provided });

    const type = extractPayloadType(snapshot.outgoing.headers) ?? snapshot.incoming.type;

    const data = snapshot.outgoing.data === undefined ? snapshot.outgoing.dataRaw : snapshot.outgoing.data;
    const dataRaw = data === undefined ? undefined : typeof data === 'object' ? serializePayload(type, data) : String(data);

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
      const payload: IRequestContextCache = {
        outgoing: snapshot.forwarded!.outgoing!,
        messages: snapshot.forwarded!.messages?.filter((message) => message.location === 'outgoing'),
      };

      const serialized = await gzip(serializePayload('json', payload)).catch((error) => {
        logger.error('Got error while zip payload', error?.stack ?? error);
        return null;
      });

      if (serialized) {
        await context.provider.databases.redis!.setex(
          <string>snapshot.cache.key,
          snapshot.cache.ttl!,
          serialized.toString('base64')
        )
          .then(() => logger.info(`Wrote cache [${snapshot.cache.key}] for [${snapshot.cache.ttl}] seconds`))
          .catch((error) => logger.error('Got error while redis set', error?.stack ?? error));
      }
    }

    return outgoing;
  }
}
