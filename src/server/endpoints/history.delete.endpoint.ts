import { EndpointFactory } from '../models';

export default EndpointFactory
  .build<{ outgoing: null }>()
  .http(<const>{ method: 'DELETE', path: '/history' })
  .io(<const>{ path: 'history:delete' })
  .compile(async ({ reply, server }) => {
    server.providers.extract().forEach((provider) => provider.storages.history.clear());
    reply.ok(null);
  });
