import axios, { AxiosError } from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import _ from 'lodash';

import { extractPayloadType, Middleware, parsePayload, serializePayload } from '../models';

export default Middleware
  .build(__filename, ['expectation', 'manipulated', 'history'])
  .assignHandler(async (context, next) => {
    if (!context.shared.expectation.forward) {
      return next();
    }

    const { url, baseUrl, timeout, proxy } = context.shared.expectation.forward;

    const forwarded = context.shared.manipulated;
    const incomingType = extractPayloadType(forwarded.incoming.headers);

    const body = forwarded.incoming.body === undefined ? forwarded.incoming.bodyRaw : forwarded.incoming.body;
    const bodyRaw = Buffer.from(typeof body === 'object' ? serializePayload(incomingType, body) : String(body));

    Object.assign(forwarded.incoming, {
      type: incomingType,
      bodyRaw: bodyRaw.toString(),

      headers: {
        'connection': 'close',

        ...forwarded.incoming.headers,
        ...((!forwarded.incoming.headers?.['transfer-encoding'] && bodyRaw?.length) && {
          'content-length': String(bodyRaw.length),
        }),
      },
    });

    const history = context.shared.history.extendForwarded(forwarded);
    context.server.exchange.ws.publish('history:updated', history.toPlain());

    const response = await axios({
      timeout: timeout ?? 1000 * 30,

      method: forwarded.incoming.method,
      headers: <Record<string, string>>forwarded.incoming.headers,

      ...(url && { url }),
      ...(baseUrl && { baseURL: baseUrl, url: forwarded.incoming.path }),

      data: bodyRaw,
      params: context.incoming.query,
      responseType: 'arraybuffer',

      ...(proxy && {
        proxy,
        httpsAgent: HttpsProxyAgent(proxy.host)
      }),
    }).catch((error: AxiosError) => {
      if (!error.response) {
        history
          .assign({ error: _.pick(error, ['message', 'code']) })
          .changeState('finished');

        context.server.exchange.ws.publish('history:updated', history.toPlain());
        context.reply.internalError(error.message);

        throw error;
      }

      return error.response;
    });

    const outgoingType = extractPayloadType(response.headers);
    const dataRaw = response.data?.toString() ?? '';

    forwarded.outgoing = {
      type: outgoingType,

      status: response.status,
      headers: response.headers,

      dataRaw,
      data: parsePayload(outgoingType, dataRaw),
    };

    history.extendForwarded(forwarded);
    context.server.exchange.ws.publish('history:updated', history.toPlain());

    return next({ forwarded });
  });
