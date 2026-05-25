import { EndpointFactory } from '../models';

export default EndpointFactory
  .build<{ outgoing: 'pong' }>()
  .http(<const>{ method: 'GET', path: '/ping' })
  .io(<const>{ path: 'ping' })
  .compile(({ reply }) => reply.ok('pong'));
