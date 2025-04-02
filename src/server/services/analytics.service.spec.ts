import { AnalyticsService } from './analytics.service';

// Test generated using Keploy
test("calculateRedisUsage_noRedisConfig_returnsZeroUsage", async () => {
  const mockServer = { databases: { redis: null } };
  const analyticsService = new AnalyticsService(<any>mockServer);

  const result = await analyticsService.calculateRedisUsage();

  expect(result).toEqual({ count: 0, bytes: 0 });
});

// Test generated using Keploy
test("calculateRedisUsage_errorDuringScan_rejectsWithError", async () => {
  const mockStream = {
    once: jest.fn((event, handler) => {
      if (event === 'error') handler(new Error('Scan Error'));
    }),
    on: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    close: jest.fn(),
  };
  const mockServer = {
    databases: {
      redis: {
        scanStream: jest.fn(() => mockStream),
        options: { keyPrefix: '' }
      }
    }
  };
  const analyticsService = new AnalyticsService(<any>mockServer);

  await expect(analyticsService.calculateRedisUsage()).rejects.toThrow('Scan Error');
  expect(mockStream.close).toHaveBeenCalled();
});


