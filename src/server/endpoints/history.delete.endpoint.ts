import { EndpointFactory } from '../models';
import config from '../../config';

export default EndpointFactory
  .build<{ outgoing: null }>()
  .http(<const>{ method: 'DELETE', path: '/history' })
  .io(<const>{ path: 'history:delete' })
  .compile(async ({ reply, server }) => {
    server.providers.extract().forEach((provider) => provider.storages.history.clear());

    if (server.databases.redis) {
      await server.databases.redis.del(config.get('history').persistence.key);
    }

    reply.ok(null);
  });
