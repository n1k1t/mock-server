import { ContainersStorage } from './storage';

// Test generated using Keploy
test('register method increases storage size correctly', () => {
  const storage = new ContainersStorage();
  const config = {
    key: 'test-key',
    payload: { data: 'test data' },
    ttl: 3600,
  };
  storage.register(config);
  expect(storage.size).toBe(1);
});

// Test generated using Keploy
test('provide method reuses existing container', () => {
  const storage = new ContainersStorage();
  const config = { key: 'test-key', payload: { data: 'test data' } };
  const container1 = storage.provide(config);
  const container2 = storage.provide(config);
  expect(container1).toBe(container2);
  expect(storage.size).toBe(1);
});

// Test generated using Keploy
test('delete method removes container and decreases size', () => {
  const storage = new ContainersStorage();
  const config = { key: 'test-key', payload: { data: 'test data' } };
  storage.register(config);
  expect(storage.size).toBe(1);
  storage.delete('test-key');
  expect(storage.size).toBe(0);
});

// Test generated using Keploy
test('getExpired method returns empty array when no containers are expired', () => {
  const storage = new ContainersStorage();
  const result = storage.getExpired();
  expect(result).toEqual([]);
});

