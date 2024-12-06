import axios, { AxiosError } from 'axios';
import { gzip, ungzip } from 'node-gzip';
import HttpsProxyAgent from 'https-proxy-agent';
import { Value } from '@n1k1t/typebox/value';
import { URL } from 'url';
import _ from 'lodash';

import { IExpectationOperatorContext } from '../../expectations';
import {
  extractPayloadType,
  IRequestContextOutgoing,
  Middleware,
  parsePayload,
  RequestContext,
  serializePayload,
} from '../models';

const compileCacheContext = (context: RequestContext, forwarded: IExpectationOperatorContext) => {
  if (!context.server.storages.redis || !forwarded.options.cache.isEnabled) {
    return null;
  }

  const payload = forwarded.options.cache.key ?? _.pick(forwarded.incoming, ['path', 'method', 'body', 'query']);
  const key = typeof payload === 'object' ? Value.Hash(payload).toString() : String(payload);

  return {
    key: `${forwarded.options.cache.prefix ?? ''}${key}`,
    ttl: forwarded.options.cache.ttl ?? 3600,
  };
}

export default Middleware
  .build(__filename, ['expectation', 'history'])
  .assignHandler(async (context, { logger }) => {
    if (!context.shared.expectation.forward) {
      return null;
    }

    const snapshot = context.shared.snapshot.assign({ forwarded: _.pick(context.shared.snapshot, ['incoming']) });
    const incomingType = extractPayloadType(snapshot.incoming.headers);

    const cache = compileCacheContext(context, snapshot);

    context.shared.history.snapshot.assign({ forwarded: snapshot.forwarded });
    context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());

    if (cache) {
      const cached = await context.server.storages.redis!.get(cache.key).catch((error) => {
        logger.error('Got error while redis get', error?.stack ?? error);
        return null;
      });

      const unziped = cached
        ? await ungzip(Buffer.from(cached, 'base64')).catch((error) => {
          logger.error('Got error while cache unzip', error?.stack ?? error);
          return null;
        })
        : null;

      const outgoing = <IRequestContextOutgoing | null>(unziped ? parsePayload('json', unziped.toString()) : null);

      if (outgoing) {
        logger.info(`Got cache [${cache.key}]`);

        snapshot.assign({ forwarded: Object.assign(snapshot.forwarded!, { outgoing }) });

        context.shared.history.snapshot.assign({ forwarded: snapshot.forwarded });
        context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());

        return context.share({ snapshot });
      }
    }

    const body = snapshot.incoming.body === undefined ? snapshot.incoming.bodyRaw : snapshot.incoming.body;
    const bodyRaw = Buffer.from(typeof body === 'object' ? serializePayload(incomingType, body) : String(body));

    const url = new URL(
      context.shared.expectation.forward.url ?? snapshot.incoming.path,
      context.shared.expectation.forward.baseUrl
    );

    const configuration = await context.server.plugins.exec(
      'forward.request', {
        timeout: context.shared.expectation.forward.timeout ?? 1000 * 30,

        method: snapshot.incoming.method,
        headers: {
          'connection': 'close',

          ...snapshot.incoming.headers,
          ...(context.shared.expectation.forward.options?.host === 'origin' && { host: url.host }),

          ...((!snapshot.incoming.headers?.['transfer-encoding'] && bodyRaw.length) && {
            'content-length': String(bodyRaw.length),
          }),
        },

        ...(context.shared.expectation.forward.url && { url: context.shared.expectation.forward.url }),
        ...(context.shared.expectation.forward.baseUrl && {
          baseURL: context.shared.expectation.forward.baseUrl,
          url: snapshot.incoming.path
        }),

        data: bodyRaw,
        params: context.incoming.query,
        responseType: 'arraybuffer',

        ...(context.shared.expectation.forward.proxy && {
          proxy: context.shared.expectation.forward.proxy,
          httpsAgent: HttpsProxyAgent(context.shared.expectation.forward.proxy.host)
        }),
      },
      context
    );

    const forwardedType = extractPayloadType(<Record<string, string>>configuration.headers ?? {});

    Object.assign(snapshot.incoming, {
      type: forwardedType,

      path: url.pathname,
      method: configuration.method ?? snapshot.incoming.method,
      headers: configuration.headers ?? {},

      ...(configuration.params && { query: configuration.params }),

      body: parsePayload(
        forwardedType,
        configuration.data instanceof Buffer ? configuration.data.toString() : configuration.data
      ),

      bodyRaw: configuration.data instanceof Buffer
        ? configuration.data.toString()
        : typeof configuration.data === 'string'
        ? configuration.data
        : '',
    });

    const response = await axios.request(configuration).catch((error: AxiosError) => {
      if (!error.response) {
        context.shared.history.snapshot.assign({ error: _.pick(error, ['message', 'code']) });
        context.shared.history.switchStatus('finished');

        context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());
        context.reply.internalError(error.message);

        logger.error('Got error while forwaring', error?.stack ?? error);
        throw error;
      }

      return error.response;
    });

    const parsed = await context.server.plugins.exec('forward.response', response, context);
    const outgoingType = parsed.type ?? extractPayloadType(response.headers);

    snapshot.forwarded!.outgoing = {
      type: outgoingType,

      status: response.status,
      headers: response.headers,

      dataRaw: parsed.raw,
      data: 'payload' in parsed ? parsed.payload : parsePayload(outgoingType, parsed.raw),
    };

    if (cache) {
      const payload = Object.assign({ isCached: true }, snapshot.forwarded!.outgoing);
      const serialized = await gzip(serializePayload('json', payload)).catch((error) => {
        logger.error('Got error while zip payload', error?.stack ?? error);
        return null;
      });

      if (serialized) {
        await context.server.storages.redis!.setex(cache.key, cache.ttl, serialized.toString('base64'))
          .then(() => logger.info(`Wrote cache [${cache.key}] for [${cache.ttl}] seconds`))
          .catch((error) => {
            logger.error('Got error while redis set', error?.stack ?? error);
            return null;
          });
      }
    }

    context.shared.history.snapshot.assign({ forwarded: snapshot.forwarded });
    context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());

    context.share({ snapshot });
  });
