import { Endpoint } from './model';

export default Endpoint
  .build<null>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/_mock/expectations' })
  .assignHandler(({ reply, expectationsStorage }) => {
    expectationsStorage.clear();
    reply.ok(null);
  });
