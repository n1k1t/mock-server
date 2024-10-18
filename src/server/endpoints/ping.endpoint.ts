import { Endpoint } from './model';

export default Endpoint
  .build<'pong'>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/ping' })
  .bindToWebSocket(<const>{ path: 'ping' })
  .assignHandler(({ reply }) => reply.ok('pong'));
