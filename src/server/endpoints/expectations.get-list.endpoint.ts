import type { Expectation } from '../expectations';
import { Endpoint } from './model';

export default Endpoint
  .build<Expectation[]>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/expectations' })
  .bindToWebSocket(<const>{ path: 'expectations:get' })
  .assignHandler(({ reply, expectationsStorage }) => reply.ok([...expectationsStorage.values()]));
