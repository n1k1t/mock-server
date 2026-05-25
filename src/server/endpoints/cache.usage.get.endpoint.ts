import { EndpointFactory } from '../models';
import { IRedisUsage } from '../services';

export default EndpointFactory
  .build<{ incoming: { query: { prefix?: string } }, outgoing: { redis: IRedisUsage } }>()
  .http(<const>{ method: 'GET', path: `/cache/usage` })
  .io(<const>{ path: 'cache:usage:get' })
  .compile(async ({ incoming, reply, server }) =>
    reply.ok({
      redis: await server.services.analytics.calculateRedisUsage(incoming.query?.prefix),
    })
  );
