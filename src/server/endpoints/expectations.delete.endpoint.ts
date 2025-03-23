import { Endpoint } from '../models';

export default Endpoint
  .build<{
    incoming: { data: void | { ids?: string[] } };
    outgoing: null;
  }>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/expectations' })
  .assignHandler(async ({ reply, incoming, provider }) => {
    await provider.client.deleteExpectations(incoming.data);
    reply.ok(null);
  });
