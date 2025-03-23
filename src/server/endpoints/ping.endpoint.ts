import { Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: 'pong' }>()
  .bindToHttp(<const>{ method: 'GET', path: '/ping' })
  .bindToIo(<const>{ path: 'ping' })
  .assignHandler(({ reply }) => reply.ok('pong'));
