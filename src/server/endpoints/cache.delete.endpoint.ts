import Redis from 'ioredis';
import _ from 'lodash';

import { Endpoint } from '../models';
import { Logger } from '../../logger';

interface IRedisResult {
  count: number;
}

const logger = Logger.build('Server.Endpoint.CacheUsage.Get');

const deleteKeys = (client: Redis, prefix?: string) => new Promise<IRedisResult>((resolve, reject) => {
  const stream = client.scanStream({ match: `${client.options.keyPrefix ?? ''}${prefix ?? ''}*` });
  const result: IRedisResult = { count: 0 };

  stream.once('end', () => resolve(result));
  stream.once('error', (error) => {
    logger.error('Got error while scan execution', error?.stack ?? error);
    stream.close();

    reject(error);
  });

  stream.on('data', async (keys: string[]) => {
    stream.pause();

    result.count += keys.length;

    await Promise
      .all(keys.map(async (key) => client.call('DEL', key)))
      .catch((error) => {
        logger.error('Got error while deletion keys', error?.stack ?? error);
        stream.close();

        reject(error);
        return [];
      });

    stream.resume();
  });
});

export default Endpoint
  .build<{ incoming: { data: { prefix?: string } }, outgoing: { redis?: IRedisResult } }>()
  .bindToHttp(<const>{ method: 'DELETE', path: `/cache` })
  .bindToIo(<const>{ path: 'cache:delete' })
  .assignHandler(async ({ incoming, reply, server }) =>
    reply.ok({
      redis: server.databases.redis
        ? await deleteKeys(server.databases.redis, incoming.data?.prefix).catch(() => undefined)
        : undefined,
    })
  );
