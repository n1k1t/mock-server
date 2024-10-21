import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<Expectation[]>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/expectations' })
  .bindToWebSocket(<const>{ path: 'expectations:get' })
  .assignHandler(({ reply, storage }) => reply.ok([...storage.expectations.values()]));
