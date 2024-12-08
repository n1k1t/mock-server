import axios, { AxiosError } from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import { ungzip } from 'node-gzip';
import { Value } from '@n1k1t/typebox/value';
import { URL } from 'url';
import _ from 'lodash';

import {
  extractPayloadType,
  IRequestContextOutgoing,
  Middleware,
  parsePayload,
  RequestContextSnapshot,
  serializePayload,
} from '../models';

const compileCacheContext = (snapshot: RequestContextSnapshot) => {
  if (!snapshot.cache.isEnabled) {
    return null;
  }

  const payload = snapshot.cache.key ?? _.pick(snapshot.incoming, ['path', 'method', 'body', 'query']);
  const key = typeof payload === 'object' ? Value.Hash(payload).toString() : String(payload);

  return {
    isEnabled: true,
    ttl: snapshot.cache.ttl ?? 3600,

    key: `${snapshot.cache.prefix ?? ''}${key}`,
    prefix: snapshot.cache.prefix,
  };
}

export default Middleware
  .build(__filename, ['expectation', 'history'])
  .assignHandler(async (context, { logger }) => {
    if (!context.shared.expectation.forward) {
      return null;
    }

    const cache = compileCacheContext(context.shared.snapshot);
    const incomingType = extractPayloadType(context.shared.snapshot.incoming.headers);

    const forwarded = context.shared.snapshot.pick(['incoming', 'outgoing']);
    const snapshot = context.shared.snapshot.assign({ forwarded, ...(cache && { cache }) });

    context.shared.history.snapshot.assign(snapshot.pick(['forwarded', 'cache']));
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

        forwarded.outgoing = outgoing;

        context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());
        return context.share({ snapshot });
      }
    }

    const body = forwarded.incoming.body === undefined ? forwarded.incoming.bodyRaw : forwarded.incoming.body;
    const bodyRaw = Buffer.from(typeof body === 'object' ? serializePayload(incomingType, body) : String(body));

    const url = new URL(
      context.shared.expectation.forward.url ?? forwarded.incoming.path,
      context.shared.expectation.forward.baseUrl
    );

    const configuration = await context.server.plugins.exec(
      'forward.request', {
        timeout: context.shared.expectation.forward.timeout ?? 1000 * 30,

        method: forwarded.incoming.method,
        headers: {
          'connection': 'close',

          ...forwarded.incoming.headers,
          ...(context.shared.expectation.forward.options?.host === 'origin' && { host: url.host }),

          ...((!forwarded.incoming.headers?.['transfer-encoding'] && bodyRaw.length) && {
            'content-length': String(bodyRaw.length),
          }),
        },

        ...(context.shared.expectation.forward.url && { url: context.shared.expectation.forward.url }),
        ...(context.shared.expectation.forward.baseUrl && {
          baseURL: context.shared.expectation.forward.baseUrl,
          url: forwarded.incoming.path
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

    Object.assign(forwarded.incoming, {
      type: forwardedType,

      path: url.pathname,
      method: configuration.method ?? forwarded.incoming.method,
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

    forwarded.outgoing = {
      type: outgoingType,

      status: response.status,
      headers: response.headers,

      dataRaw: parsed.raw,
      data: 'payload' in parsed ? parsed.payload : parsePayload(outgoingType, parsed.raw),
    };

    context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());
    context.share({ snapshot });
  });
