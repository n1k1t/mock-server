import { IRedisUsage } from '../services';
import { Endpoint } from '../models';

export default Endpoint
  .build<{ incoming: { query: { prefix?: string } }, outgoing: { redis: IRedisUsage } }>()
  .bindToHttp(<const>{ method: 'GET', path: `/cache/usage` })
  .bindToIo(<const>{ path: 'cache:usage:get' })
  .assignHandler(async ({ incoming, reply, server }) =>
    reply.ok({
      redis: await server.services.analytics.calculateRedisUsage(incoming.query?.prefix),
    })
  );
