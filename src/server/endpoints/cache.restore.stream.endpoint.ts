import { ungzip } from 'node-gzip';

import { ICacheBackup, IIoIncomingStream } from '../types';
import { Endpoint } from '../models';
import { Logger } from '../../logger';

const logger = Logger.build('Server.Endpoints.CacheRestore');

export default Endpoint
  .build<{ incoming: { data: IIoIncomingStream<{ ttl: number }>, outgoing: null }, outgoing: null }>()
  .bindToIo(<const>{ path: 'cache:restore:stream' })
  .assignHandler(async ({ incoming, reply, server }) => {
    const chunks: string[] = [];

    if (!incoming.data?.stream) {
      return reply.validationError(['Wrong input data format']);
    }

    incoming.data.stream.on('data', (chunk) => chunks.push(chunk.toString()));
    await new Promise((resolve) => incoming.data!.stream.once('finish', resolve));

    const unziped = await ungzip(Buffer.from(chunks.join(''), 'base64')).catch((error) => {
      logger.error('Got error while cache unzip', error?.stack ?? error);
      return null;
    });

    if (!unziped) {
      return reply.internalError('Cannot unzip backup payload');
    }

    const ttl = incoming.data.parameters.ttl ?? 60 * 60;
    const backup: ICacheBackup = JSON.parse(unziped.toString('utf8'));

    if (server.databases.redis) {
      await Promise.all(backup.redis.map(([key, value]) =>
        server.databases.redis!.setex(key, ttl, value).catch((error) => {
          logger.error(`Got error while inserting key [${key}]`, error?.stack ?? error);
          return null;
        })
      ));
    }

    reply.ok(null);
  });
