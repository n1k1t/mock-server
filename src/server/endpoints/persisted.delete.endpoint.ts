import _ from 'lodash';

import { EndpointFactory } from '../models';
import { RxConverter } from '../utils';
import { Logger } from '../../logger';

import config from '../../config';

interface IOutgoing {
  redis?: {
    count: number;
  };
}

const logger = Logger.build('Endpoints.CacheDelete');

export default EndpointFactory
  .build<{
    incoming: {
      data: {
        tags?: ('history' | 'containers')[];
      };
    };

    outgoing: IOutgoing;
  }>()
  .http(<const>{ method: 'DELETE', path: `/persisted` })
  .io(<const>{ path: 'persisted:delete' })
  .compile(async ({ incoming, reply, server }) => {
    const tags = incoming.data?.tags ?? [];
    const result: IOutgoing = {
      ...(server.databases.redis && {
        redis: {
          count: 0,
        },
      }),
    };

    if (result.redis) {
      for (const tag of tags) {
        const converter = RxConverter.build(
          server.services.redis.iterate(`${config.get(tag).persistence.key}*`, {
            ignore: [],
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
    }

    reply.ok(result);
  });
