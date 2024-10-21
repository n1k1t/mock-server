import axios, { AxiosError } from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
import _ from 'lodash';

import { IResponsePlainContext } from '../models';
import { parseJsonSafe } from '../../utils';
import { Middleware } from '../models';

export default Middleware
  .build(__filename)
  .requires(['expectation', 'historyRecord'])
  .assignHandler(async (context, next) => {
    if (!context.shared.expectation.forward) {
      return next();
    }

    const { protocol, host, port, timeout, proxy } = context.shared.expectation.forward;
    const manipulatedContext = context.shared.expectation
      .manipulateContext('request', context.toPlain(), { clone: true });

    const body = manipulatedContext.body === undefined ? manipulatedContext.bodyRaw : manipulatedContext.body;
    const bodyRaw = Buffer.from(typeof body === 'object' ? JSON.stringify(body) : String(body));

    Object.assign(manipulatedContext, {
      bodyRaw,
      headers: {
        'connection': 'close',

        ...manipulatedContext.headers,
        ...((!manipulatedContext.headers?.['transfer-encoding'] && bodyRaw?.length) && {
          'content-length': String(bodyRaw.length),
        }),
      },
    });

    const historyRecord = context.shared.historyRecord.assign({ forwaded: { request: manipulatedContext } });
    context.exchange.ws.publish('history:updated', historyRecord);

    const response = await axios({
      timeout: timeout ?? 1000 * 30,

      method: manipulatedContext.method,
      headers: manipulatedContext.headers,

      url: manipulatedContext.path,
      baseURL: `${protocol.toLocaleLowerCase()}://${host}:${port}`,

      data: bodyRaw,
      params: context.query,
      responseType: 'arraybuffer',

      ...(proxy && {
        proxy,
        httpsAgent: HttpsProxyAgent(proxy.host)
      }),
    }).catch((error: AxiosError) => {
      if (!error.response) {
        historyRecord
          .assign({ error: _.pick(error, ['message', 'code']) })
          .changeState('finished');

        context.exchange.ws.publish('history:updated', historyRecord);
        context.reply.internalError(error.message);

        throw error;
      }

      return error.response;
    });

    const contentTypeKey = Object
      .keys(response.headers)
      .find((key) => key.toLowerCase() === 'content-type');

    const isJsonData = _.flatten([_.get(response.headers, contentTypeKey ?? '', '')])
      .join(',')
      .toLowerCase()
      .includes('application/json');

    const parsingResponseDataResult = isJsonData ? parseJsonSafe(response.data) : null;
    const responseContext: IResponsePlainContext = {
      payloadType: isJsonData ? 'json' : 'plain',

      statusCode: response.status,
      headers: response.headers,

      dataRaw: response.data?.toString() ?? '',
      ...(parsingResponseDataResult?.status === 'OK' && { data: parsingResponseDataResult.result }),
    };

    historyRecord.extendForwarded({
      response: responseContext,
      curl: _.get(response.config, 'curlCommand'),
    });

    context.exchange.ws.publish('history:updated', historyRecord);

    return next({
      forwarded: {
        request: manipulatedContext,
        response: responseContext,
      },
    });
  });
