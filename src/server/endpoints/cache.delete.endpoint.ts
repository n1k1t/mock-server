import _ from 'lodash';

import { EndpointFactory } from '../models';
import { RxConverter } from '../utils';
import { Logger } from '../../logger';

interface IOutgoing {
  redis?: {
    count: number;
  };
}

const logger = Logger.build('Endpoints.CacheDelete');

export default EndpointFactory
  .build<{ incoming: { data: { prefix?: string } }, outgoing: IOutgoing }>()
  .http(<const>{ method: 'DELETE', path: `/cache` })
  .io(<const>{ path: 'cache:delete' })
  .compile(async ({ incoming, reply, server }) => {
    const result: IOutgoing = {
      ...(server.databases.redis && {
        redis: {
          count: 0,
        },
      }),
    };

    if (result.redis) {
      const converter = RxConverter.build(
        server.services.redis.iterate(incoming.data?.prefix ?? '*', {
          trim: true,
        })
      );

      for await (const key of converter.iterate()) {
        const deleted = await server.databases.redis!.del(key).catch((error) => {
          logger.error(`Got error while deletion redis value for key [${key}]`, error?.stack ?? error);
          return null;
        });

        if (deleted) {
          result.redis.count += deleted;
        }
      }
    }

    reply.ok(result);
  });
