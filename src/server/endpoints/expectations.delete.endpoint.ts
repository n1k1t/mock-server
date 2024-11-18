import { Endpoint } from '../models';

export default Endpoint
  .build<null, { body: void | { ids?: string[] } }>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/_mock/expectations' })
  .assignHandler(async ({ reply, incoming, server }) => {
    await server.client.deleteExpectations(incoming.body);
    reply.ok(null);
  });
