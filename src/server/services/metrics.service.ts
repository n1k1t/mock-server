import _ from 'lodash';

import { Service } from '../models';
import { cast } from '../../utils';

export type TMetricPoint<K extends string = string> = {
  timestamp: number;
  values: Record<K, number>;
}

export class MetricsService extends Service {
  private limit = this.options?.limit ?? 300;

  public points = {
    containers: cast<TMetricPoint<'count'>[]>([]),
    memory: cast<TMetricPoint<'mbs'>[]>([]),
    cache: cast<TMetricPoint<'redis_mbs' | 'redis_count'>[]>([]),
    rate: cast<TMetricPoint<'count'>[]>([]),
  };

  constructor(server: Service['server'], private options?: { limit?: number }) {
    super(server);
  }

  public register<K extends keyof MetricsService['points']>(
    name: K,
    values: MetricsService['points'][K][0]['values'],
  ): this {
    if (!this.points[name]) {
      throw new Error('Invalid metric name');
    }

    const group: TMetricPoint[] = this.points[name];
    const point: TMetricPoint = { timestamp: Date.now(), values };

    group.push(point);
    group.splice(0, _.clamp(group.length - this.limit, 0, Infinity));

    this.server.exchanges.io.publish('metric:registered', { name, point });
    return this;
  }

  static build(server: Service['server'], options?: MetricsService['options']) {
    return new MetricsService(server, options);
  }
}
