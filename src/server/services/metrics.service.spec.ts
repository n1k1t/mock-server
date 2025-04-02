import { MetricsService } from './metrics.service';
import { Service } from '../models';

// Test generated using Keploy
class MockService {
  exchanges = { io: { publish: jest.fn() }};
}

test('should register a valid containers metric point and maintain correct limit', () => {
  const mockServer = new MockService();
  const service = new MetricsService(<any>mockServer, { limit: 2 });

  service.register('containers', { count: 1 });
  service.register('containers', { count: 2 });
  service.register('containers', { count: 3 });

  expect(service.points.containers.length).toBe(2); // Should only keep the last 2 entries
  expect(service.points.containers[0].values.count).toBe(2);
  expect(service.points.containers[1].values.count).toBe(3);
  expect(mockServer.exchanges.io.publish).toHaveBeenCalledTimes(3);
  expect(mockServer.exchanges.io.publish).toHaveBeenCalledWith('metric:registered', expect.objectContaining({ name: 'containers' }));
});

// Test generated using Keploy
test('should throw an error for invalid metric name', () => {
  const mockServer = new MockService();
  const service = new MetricsService(<any>mockServer);

  expect(() => service.register<any>('invalidName', { count: 1 })).toThrow('Invalid metric name');
});


// Test generated using Keploy
test('build method should initialize MetricsService correctly', () => {
  const mockServer = new MockService();
  const service = MetricsService.build(<any>mockServer, { limit: 5 });

  expect(service).toBeInstanceOf(MetricsService);
  expect(service['options']?.limit).toBe(5);
});


