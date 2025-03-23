import { Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: null }>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/history' })
  .bindToIo(<const>{ path: 'history:delete' })
  .assignHandler(({ reply, server }) => {
    [...server.providers.values()].forEach((provider) => provider.storages.history.clear());
    reply.ok(null);
  });
