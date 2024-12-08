import { gzip } from 'node-gzip';
import rfdc from 'rfdc';
import _ from 'lodash';

import { extractPayloadType, Middleware, serializePayload } from '../models';

const clone = rfdc();

export default Middleware
  .build(__filename, ['history', 'snapshot', 'expectation'])
  .assignHandler(async (context, { logger }) => {
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

    context.shared.history.snapshot.assign(snapshot.omit(['incoming', 'forwarded']));
    context.shared.history.switchStatus('finished');

    context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());

    const shouldBeCached = snapshot.cache.isEnabled
      && typeof snapshot.cache.key === 'string'
      && snapshot.cache.ttl
      && snapshot.forwarded?.outgoing
      && !snapshot.forwarded.outgoing.isCached;

    if (shouldBeCached) {
      const payload = Object.assign({ isCached: true }, snapshot.forwarded!.outgoing);
      const serialized = await gzip(serializePayload('json', payload)).catch((error) => {
        logger.error('Got error while zip payload', error?.stack ?? error);
        return null;
      });

      if (serialized) {
        await context.server.storages.redis!.setex(<string>snapshot.cache.key, snapshot.cache.ttl!, serialized.toString('base64'))
          .then(() => logger.info(`Wrote cache [${snapshot.cache.key}] for [${snapshot.cache.ttl}] seconds`))
          .catch((error) => {
            logger.error('Got error while redis set', error?.stack ?? error);
            return null;
          });
      }
    }

    context.complete();
  });
