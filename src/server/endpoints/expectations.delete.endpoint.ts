import { EndpointFactory } from '../models';

export default EndpointFactory
  .build<{
    incoming: { data: void | { ids?: string[] } };
    outgoing: null;
  }>()
  .http(<const>{ method: 'DELETE', path: '/expectations' })
  .compile(async ({ reply, incoming, server }) => {
    for (const provider of server.providers.extract()) {
      await provider.client.deleteExpectations(incoming.data);
    }

    reply.ok(null);
  });
