import { ungzip } from 'node-gzip';

import { ICacheBackup } from '../types';
import { Endpoint } from '../models';
import { Logger } from '../../logger';

const logger = Logger.build('Server.Endpoints.CacheRestore');

export default Endpoint
  .build<{ incoming: { data: { backup: string, ttl?: number } }, outgoing: null }>()
  .bindToHttp(<const>{ method: 'POST', path: `/cache/restore` })
  .bindToIo(<const>{ path: 'cache:restore' })
  .assignHandler(async ({ incoming, reply, server }) => {
    const unziped = await ungzip(Buffer.from(incoming.data!.backup, 'base64')).catch((error) => {
      logger.error('Got error while cache unzip', error?.stack ?? error);
      return null;
    });

    if (!unziped) {
      return reply.internalError('Cannot unzip backup payload');
    }

    const ttl = incoming.data!.ttl ?? 60 * 60;
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
