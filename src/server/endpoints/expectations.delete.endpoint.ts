import { Endpoint } from './model';

export default Endpoint
  .build<null, { body: { id: string } }>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/_mock/expectations' })
  .assignHandler(({ reply, body, expectationsStorage }) => {
    if (!expectationsStorage.has(body.id)) {
      return reply.notFound();
    }

    expectationsStorage.delete(body.id);
    reply.ok(null);
  });
