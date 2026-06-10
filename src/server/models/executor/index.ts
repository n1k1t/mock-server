import merge from 'deepmerge';
import rfdc from 'rfdc';
import _ from 'lodash';

import { gzip, ungzip } from 'node-gzip';
import { from } from 'rxjs';

import type { Expectation, IExpectationSchemaForward } from '../../../expectations';

import { parsePayload, serializePayload } from '../../utils';
import { cast, parseJsonSafe, wait } from '../../../utils';
import { ExecutorManualError } from './errors';
import { RequestMessage } from '../message';
import { Logger } from '../../../logger';
import {
  RequestContext,
  definePayloadType,
  IRequestContextCache,
  IRequestContextOutgoing,
  IRequestContextIncoming,
  IRequestContextForwarded,
} from '../context';

export * from './errors';

const clone = rfdc();
const logger = Logger.build('Executor');

export interface IExecutorExecOptions {
  expectation?: Expectation;
}

export abstract class Executor<TRequestContext extends RequestContext = RequestContext> {
  public TRequestContext!: TRequestContext;
  public TContext!: TRequestContext['TContext'];

  /** Uses to handle request forwarding */
  public abstract forward(
    context: TRequestContext,
    incoming: IRequestContextIncoming,
    schema: IExpectationSchemaForward,
  ): Promise<IRequestContextForwarded | null>;

  /** Uses to handle outgoing payload and reply */
  public abstract reply(
    context: TRequestContext,
    outgoing: IRequestContextOutgoing
  ): Promise<IRequestContextOutgoing | null>;

  /** Matches expectation */
  public async match(context: TRequestContext): Promise<Expectation | null> {
    return context.provider.storages.expectations.match(context.snapshot);
  }

  /** Prepares context right after expectation was manipulated */
  public async prepare(context: TRequestContext): Promise<unknown> {
    return null;
  }

  /** Uses to handle whole request */
  public async exec(context: TRequestContext, options?: IExecutorExecOptions): Promise<TRequestContext> {
    context.streams.incoming.subscribe({
      error: () => null,
      next: (message) => context.snapshot.messages.push(message.clone({ deep: true }).redirect('incoming')),
    });

    context.streams.outgoing.subscribe({
      error: () => null,
      next: (message) => context.snapshot.messages.push(message.clone().redirect('outgoing')),
    });

    const expectation = options?.expectation ? options.expectation : await this.match(context).catch((error) => {
      logger.error('Got error while execution [matchExpectation] method', error?.stack ?? error);
      return null;
    });

    if (!expectation) {
      if (!context.outgoing) {
        context.provider.storages.history.unregister(context.history);
        return context;
      }

      if (context.history?.is('registered')) {
        context.history.switch('pending');
      }

      return context;
    }

    if (expectation.defaults?.state) {
      context.snapshot.state = merge(expectation.defaults.state, context.snapshot.state, {
        arrayMerge: (target, source) => source,
      });
    }

    context.assign({
      snapshot: await expectation.request.manipulate(context.snapshot),
      expectation: expectation.increaseExecutionsCounter(),
    });

    await this
      .prepare(context)
      .catch((error) => logger.error('Got error while execution [prepare] method', error?.stack ?? error));

    context.provider.server.exchanges.io.publish('expectation:updated', expectation.toPlain());
    logger.info('Expectation has matched as', `"${expectation.name}" [${expectation.id}]`);

    if (context.history?.is('registered')) {
      context.history
        .switch('pending')
        .actualize(context.snapshot)
        .assign({ expectation: context.expectation });

      context.provider.server.exchanges.io.publish('history:added', context.history.toPlain());
      context.provider.server.services.metrics.register('rate', { count: 1 });
    }

    if (!context.is(['handling'])) {
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

    if (expectation.schema.forward) {
      const forwarded = await this.handleForwarding(context).catch((error) => {
        logger.error('Got error while execution [handleForwarding] method', error?.stack ?? error);
        return null;
      });

      if (forwarded) {
        context.snapshot.assign({
          outgoing: forwarded.outgoing ?? context.snapshot.outgoing,

          forwarded: {
            schema: forwarded.schema,
            messages: forwarded.messages,

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

      if (context.snapshot.forwarded && context.history?.is('pending')) {
        context.history.actualize(context.snapshot);
        context.provider.server.exchanges.io.publish('history:updated', context.history.toPlain());
      }
    }

    if (!context.is(['handling'])) {
      return context;
    }

    const outgoing = await this.handleReplying(context).catch((error) => {
      logger.error('Got error while execution [handleReplying] method', error?.stack ?? error);
      return null;
    });

    return outgoing ? context.assign({ outgoing }) : context;
  }

  private async handleForwarding(context: TRequestContext): Promise<IRequestContextForwarded | null> {
    if (!context.expectation?.schema.forward) {
      return null;
    }

    const snapshot = context.snapshot.assign({ cache: context.compileCacheConfiguration() });
    const schema = snapshot.overrides?.forward
      ? merge(context.expectation.schema.forward, <IExpectationSchemaForward>snapshot.overrides.forward)
      : context.expectation.schema.forward;

    if (schema.isEnabled === false) {
      return null;
    }

    if (snapshot.cache.isEnabled) {
      const zipped = await context.provider.server.databases.redis!.get(snapshot.cache.key).catch((error) => {
        logger.error('Got error while redis get', error?.stack ?? error);
        return null;
      });

      const unzipped = zipped
        ? await ungzip(Buffer.from(zipped, 'base64')).catch((error) => {
          logger.error('Got error while cache unzip', error?.stack ?? error);
          return null;
        })
        : null;

      const cahce = unzipped ? parseJsonSafe<IRequestContextCache>(unzipped.toString()) : null;

      if (cahce?.status === 'OK') {
        logger.info(`Got cache [${snapshot.cache.key}]`);

        const messages = (cahce.result.messages ?? []).map((message) => RequestMessage.build(message));
        const dataRaw = cahce.result.outgoing.dataRaw
          ? Buffer.from(cahce.result.outgoing.dataRaw, 'base64')
          : undefined;

        cahce.result.outgoing.stream = from(messages);
        snapshot.cache.hasRead = true;

        const outgoing = dataRaw
          ? parsePayload(dataRaw, cahce.result.outgoing.type)
          : null;

        return {
          schema,
          messages,

          incoming: snapshot.incoming,

          outgoing: Object.assign(_.omit(cahce.result.outgoing, ['dataRaw']), {
            dataRaw,

            type: outgoing?.type ?? 'plain',
            data: outgoing?.data ?? undefined,
          }),
        };
      }
    }

    const type = definePayloadType(snapshot.incoming.headers) ?? (
      snapshot.incoming.type === 'plain'
        ? typeof snapshot.incoming.data === 'object' ? 'json' : 'plain'
        : snapshot.incoming.type
    );

    const dataRaw = snapshot.incoming.data === undefined
      ? snapshot.incoming.dataRaw
      : serializePayload(type, snapshot.incoming.data);

    const forwarded = await this
      .forward(context, Object.assign(snapshot.incoming, { type, dataRaw }), schema)
      .catch((error) => {
        logger.error('Got error while execution [forward] method', error?.stack ?? error);
        return null;
      });

    if (forwarded) {
      forwarded.messages = [];

      snapshot.incoming.stream?.subscribe({
        error: () => null,
        next: (message) => forwarded.messages!.push(message.clone().redirect('incoming')),
      });

      forwarded.outgoing?.stream?.subscribe({
        error: () => null,
        next: (message) => forwarded.messages!.push(message.clone({ deep: true }).redirect('outgoing')),
      });
    }

    return forwarded;
  }

  private async handleReplying(context: TRequestContext): Promise<IRequestContextOutgoing | null> {
    const snapshot = context.expectation?.response
      ? await context.expectation.response.manipulate(context.snapshot)
      : context.snapshot;

    const type = definePayloadType(snapshot.outgoing.headers) ?? (
      snapshot.outgoing.type === 'plain'
        ? typeof snapshot.outgoing.data === 'object' ? 'json' : 'plain'
        : snapshot.outgoing.type
    );

    const dataRaw = snapshot.outgoing.data === undefined
      ? snapshot.outgoing.dataRaw
      : serializePayload(type, snapshot.outgoing.data);

    const outgoing = await this
      .reply(context, Object.assign(snapshot.outgoing, { type, dataRaw }))
      .catch((error) => {
        logger.error('Got error while execution [reply] method', error?.stack ?? error);
        return null;
      });

    const shouldBeCached = snapshot.cache.isEnabled
      && snapshot.forwarded?.outgoing
      && !snapshot.cache.hasRead
      && snapshot.cache.ttl
      && typeof snapshot.cache.key === 'string';

    if (shouldBeCached) {
      const serialized = serializePayload('json', cast<IRequestContextCache>({
        messages: (snapshot.forwarded!.messages ?? [])
          .filter((message) => message.direction === 'outgoing')
          .map((message) => message.toPlain()),

        outgoing: Object.assign(_.omit(snapshot.forwarded!.outgoing, ['data']), {
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
        await context.provider.server.databases.redis!.setex(
          <string>snapshot.cache.key,
          snapshot.cache.ttl!,
          zipped.toString('base64')
        )
          .then(() => {
            logger.info(`Wrote cache [${snapshot.cache.key}] for [${snapshot.cache.ttl}] seconds`);
            snapshot.cache.hasWritten = true;
          })
          .catch((error) => logger.error('Got error while redis set', error?.stack ?? error));
      }
    }

    return outgoing;
  }
}
