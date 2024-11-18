import { Endpoint } from '../models';

export default Endpoint
  .build<'pong'>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/ping' })
  .bindToWs(<const>{ path: 'ping' })
  .assignHandler(({ reply }) => reply.ok('pong'));
