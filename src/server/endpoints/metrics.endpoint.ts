import { EndpointFactory } from '../models';
import { MetricsService } from '../services';

export default EndpointFactory
  .build<{
    outgoing: MetricsService['points'];
  }>()
  .http(<const>{ method: 'GET', path: '/metrics' })
  .io(<const>{ path: 'metrics:get' })
  .compile(({ reply, server }) =>
    reply.ok(server.services.metrics.points)
  );
