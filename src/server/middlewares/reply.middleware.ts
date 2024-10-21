import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__dirname)
  .requires(['historyRecord', 'expectation'])
  .assignHandler((context) => {
    const responseContext = context.shared.expectation.manipulateContext(
      'response',
      Object.assign(context.toPlain(), context.shared.forwarded?.response ?? {
        statusCode: 200,
        headers: {},

        data: {},
        dataRaw: '',
      }),
      { clone: true }
    );

    const dataRaw = Buffer.from(
      Object.keys(responseContext?.data ?? {}).length
        ? JSON.stringify(responseContext.data)
        : (responseContext.dataRaw ?? '')
    );

    Object.assign(responseContext, {
      dataRaw: dataRaw.toString(),
      headers: {
        ...(responseContext.payloadType === 'json' && { 'content-type': 'application/json' }),
        ...responseContext.headers,

        ...((!responseContext.headers?.['transfer-encoding'] && !context.http.request.headers['transfer-encoding']) && {
          'content-length': String(dataRaw.length),
        }),
      }
    })

    context.http.response.writeHead(responseContext.statusCode ?? 200, responseContext.headers);
    context.http.response.write(responseContext.dataRaw);
    context.http.response.end();

    context.shared.historyRecord
      .assign({ response: responseContext })
      .changeState('finished');

    context.exchange.ws.publish('history:updated', context.shared.historyRecord);
  });
