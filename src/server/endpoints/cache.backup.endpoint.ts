import { gzip } from 'node-gzip';

import { EndpointFactory } from '../models';
import { ICacheBackup } from '../types';
import { RxConverter } from '../utils';
import { Logger } from '../../logger';

const logger = Logger.build('Endpoints.CacheBackup');

export default EndpointFactory
  .build<{ outgoing: string }>()
  .http(<const>{ method: 'POST', path: `/cache/backup` })
  .io(<const>{ path: 'cache:backup' })
  .compile(async ({ reply, server }) => {
    const backup: ICacheBackup = { redis: [] };

    if (server.databases.redis) {
      const converter = RxConverter.build(server.services.analytics.iterateRedisKeys());

      for await (const key of converter.iterate()) {
        const unprefixed = server.databases.redis!.options.keyPrefix
          ? key.replace(server.databases.redis!.options.keyPrefix, '')
          : key;

        const value = await server.databases.redis!.get(unprefixed).catch((error) => {
          logger.error(`Got error while fetching redis value for key [${key}]`, error?.stack ?? error);
          return null;
        });

        value
          ? backup.redis.push([unprefixed, value])
          : logger.warn(`Got [${value}] for key [${key}]`);
      }
    }

    const zipped = await gzip(JSON.stringify(backup)).catch((error) => {
      logger.error('Got error while zip payload', error?.stack ?? error);
      return null;
    });

    zipped
      ? reply.ok(zipped.toString('base64'))
      : reply.internalError('Cannot zip backup payload');
  });
