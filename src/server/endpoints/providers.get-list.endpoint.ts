import { EndpointFactory, Provider } from '../models';

export default EndpointFactory
  .build<{
    outgoing: Pick<Provider, 'group' | 'timestamp' | 'ttl'>[];
  }>()
  .http(<const>{ method: 'GET', path: '/providers' })
  .compile(({ reply, server }) => reply.ok(
    server.providers.extract().map((provider) => ({
      timestamp: provider.timestamp,

      group: provider.group,
      ttl: provider.ttl,
    }))
  ));
