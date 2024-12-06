import rfdc from 'rfdc';
import _ from 'lodash';

import { extractPayloadType, Middleware, serializePayload } from '../models';

const clone = rfdc();

export default Middleware
  .build(__filename, ['history', 'snapshot', 'expectation'])
  .assignHandler(async (context) => {
    const outgoing = context.shared.snapshot.forwarded?.outgoing
      ? clone(context.shared.snapshot.forwarded.outgoing)
      : context.shared.snapshot.outgoing;

    const snapshot = context.shared.expectation.response
      ? context.shared.expectation.response?.manipulate(context.shared.snapshot.assign({ outgoing }))
      : context.shared.snapshot.assign({ outgoing });

    const type = extractPayloadType(snapshot.outgoing.headers);

    const data = snapshot.outgoing.data === undefined ? snapshot.outgoing.dataRaw : snapshot.outgoing.data;
    const dataRaw = Buffer.from(typeof data === 'object' ? serializePayload(type, data) : String(data));

    Object.assign(snapshot.outgoing, {
      type,

      dataRaw: dataRaw.toString(),
      headers: Object.assign(snapshot.outgoing.headers, {
        ...((!snapshot.outgoing.headers?.['transfer-encoding'] && !context.request.headers['transfer-encoding']) && {
          'content-length': String(dataRaw.length),
        }),
      })
    });

    await context.server.plugins.exec('outgoing.response', context.response, context.assignOutgoing(snapshot.outgoing));

    context.shared.snapshot.assign({ outgoing: snapshot.outgoing });
    context.shared.history.snapshot.assign(_.omit(snapshot, ['incoming', 'forwarded']));

    context.shared.history.switchStatus('finished');
    context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());

    context.complete();
  });
