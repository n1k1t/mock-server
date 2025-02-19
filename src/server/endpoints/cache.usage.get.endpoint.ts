import Redis from 'ioredis';
import _ from 'lodash';

import { Endpoint } from '../models';
import { Logger } from '../../logger';

interface IRedisResult {
  count: number;
  bytes: number;
}

const logger = Logger.build('Server.Endpoint.CacheUsage.Get');

const deleteRedisKeys = (client: Redis, prefix?: string) => new Promise<IRedisResult>((resolve, reject) => {
  const stream = client.scanStream({ match: `${client.options.keyPrefix ?? ''}${prefix ?? ''}*` });
  const result: IRedisResult = { count: 0, bytes: 0 };

  stream.once('end', () => resolve(result));
  stream.once('error', (error) => {
    logger.error('Got error while scan execution', error?.stack ?? error);
    stream.close();

    reject(error);
  });

  stream.on('data', async (keys: string[]) => {
    stream.pause();

    result.count += keys.length;

    const usage = await Promise
      .all(keys.map(async (key) => client.call('MEMORY', 'USAGE', key)))
      .catch((error) => {
        logger.error('Got error while fetching memory usage', error?.stack ?? error);
        stream.close();

        reject(error);
        return [];
      });

    usage.forEach((bytes) => result.bytes += Number(bytes));

    stream.resume();
  });
});

export default Endpoint
  .build<{ incoming: { query: { prefix?: string } }, outgoing: { redis?: IRedisResult } }>()
  .bindToHttp(<const>{ method: 'GET', path: `/cache/usage` })
  .bindToIo(<const>{ path: 'cache:usage:get' })
  .assignHandler(async ({ incoming, reply, server }) =>
    reply.ok({
      redis: server.databases.redis
        ? await deleteRedisKeys(server.databases.redis, incoming.query?.prefix).catch(() => undefined)
        : undefined,
    })
  )
  .compile();
