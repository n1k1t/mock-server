import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<Expectation['TPlain'][]>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/expectations' })
  .bindToWs(<const>{ path: 'expectations:get' })
  .assignHandler(({ reply, server }) =>
    reply.ok(
      [...server.storage.expectations.values()].map((expectation) => expectation.toPlain())
    )
  );
