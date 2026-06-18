import { EndpointFactory } from '../models';

export default EndpointFactory
  .build<{ outgoing: null }>()
  .http(<const>{ method: 'DELETE', path: '/containers' })
  .io(<const>{ path: 'containers:delete' })
  .compile(async ({ reply, server }) => {
    server.providers.extract().forEach((provider) => provider.storages.containers.clear());
    reply.ok(null);
  });
