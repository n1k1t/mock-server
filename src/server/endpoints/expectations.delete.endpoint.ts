import { Endpoint } from '../models';

export default Endpoint
  .build<null, { body: void | { ids?: string[] } }>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/_mock/expectations' })
  .assignHandler(async ({ reply, body, client }) => {
    await client.deleteExpectations(body);
    reply.ok(null);
  });
