import { Endpoint } from '../models';
import config from '../../config';

export default Endpoint
  .build<{ outgoing: null }>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/history' })
  .bindToIo(<const>{ path: 'history:delete' })
  .assignHandler(async ({ reply, server }) => {
    server.providers.extract().forEach((provider) => provider.storages.history.clear());

    if (server.databases.redis) {
      await server.databases.redis.del(config.get('history').persistence.key);
    }

    reply.ok(null);
  });
