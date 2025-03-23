import { MetricsService } from '../services';
import { Endpoint } from '../models';

export default Endpoint
  .build<{
    outgoing: MetricsService['points'];
  }>()
  .bindToHttp(<const>{ method: 'GET', path: '/metrics' })
  .bindToIo(<const>{ path: 'metrics:get' })
  .assignHandler(({ reply, server }) =>
    reply.ok(server.services.metrics.points)
  );
