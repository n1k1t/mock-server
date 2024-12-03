import axios, { AxiosError } from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import _ from 'lodash';

import { extractPayloadType, Middleware, parsePayload, serializePayload } from '../models';
import { URL } from 'url';

export default Middleware
  .build(__filename, ['expectation', 'manipulated', 'history'])
  .assignHandler(async (context, { logger }) => {
    if (!context.shared.expectation.forward) {
      return null;
    }

    const { url, baseUrl, timeout, proxy } = context.shared.expectation.forward;

    const forwarded = context.shared.manipulated;
    const incomingType = extractPayloadType(forwarded.incoming.headers);

    const body = forwarded.incoming.body === undefined ? forwarded.incoming.bodyRaw : forwarded.incoming.body;
    const bodyRaw = Buffer.from(typeof body === 'object' ? serializePayload(incomingType, body) : String(body));

    const configuration = await context.server.plugins.exec(
      'forward.request', {
        timeout: timeout ?? 1000 * 30,

        method: forwarded.incoming.method,
        headers: {
          'connection': 'close',

          ...forwarded.incoming.headers,
          ...((!forwarded.incoming.headers?.['transfer-encoding'] && bodyRaw.length) && {
            'content-length': String(bodyRaw.length),
          }),
        },

        ...(url && { url }),
        ...(baseUrl && { baseURL: baseUrl, url: forwarded.incoming.path }),

        data: bodyRaw,
        params: context.incoming.query,
        responseType: 'arraybuffer',

        ...(proxy && {
          proxy,
          httpsAgent: HttpsProxyAgent(proxy.host)
        }),
      },
      context
    );

    const forwardedType = extractPayloadType(<Record<string, string>>configuration.headers ?? {});

    Object.assign(forwarded.incoming, {
      type: forwardedType,

      path: new URL(configuration.url ?? forwarded.incoming.path, baseUrl).pathname,
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

    const history = context.shared.history.extendForwarded(forwarded);
    context.server.exchange.ws.publish('history:updated', history.toPlain());

    const response = await axios.request(configuration).catch((error: AxiosError) => {
      if (!error.response) {
        history.assignError(_.pick(error, ['message', 'code'])).switchState('finished');

        context.server.exchange.ws.publish('history:updated', history.toPlain());
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

    history.extendForwarded(forwarded);

    context.server.exchange.ws.publish('history:updated', history.toPlain());
    context.share({ forwarded });
  });
