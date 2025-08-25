import { Endpoint, Provider } from '../models';

export default Endpoint
  .build<{
    outgoing: Pick<Provider, 'group' | 'timestamp' | 'ttl'>[];
  }>()
  .bindToHttp(<const>{ method: 'GET', path: '/providers' })
  .assignHandler(({ reply, server }) => reply.ok(
    server.providers.extract().map((provider) => ({
      timestamp: provider.timestamp,

      group: provider.group,
      ttl: provider.ttl,
    }))
  ));
