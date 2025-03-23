import { HistoryStorage } from './storage';
import { History } from './model';
import config from '../../../config';

// Test generated using Keploy
test('test_registerHistory_withoutExistingHistory_createsValidHistory', () => {
  const storage = new HistoryStorage({ group: 'test-group' });
  const historyData = { snapshot: {} };
  const result = storage.register(<any>historyData);
  expect(result).toBeInstanceOf(History);
  expect(result.group).toBe('test-group');
  expect(result.snapshot).toEqual(historyData.snapshot);
});

// Test generated using Keploy
test('test_unregisterHistory_removesHistoryFromStorage', () => {
  const storage = new HistoryStorage({ group: 'test-group' });
  const historyInstance = new History(<any>{ id: '1', snapshot: {} });
  storage.register(historyInstance);
  expect(storage.size).toBe(1);
  storage.unregister(historyInstance);
  expect(storage.size).toBe(0);
});

// Test generated using Keploy
test('test_registerHistory_exceedsLimit_removesOldestEntry', () => {
  const mockConfig = { get: () => ({ limit: 2 }) };
  jest.spyOn(config, 'get').mockImplementation(<any>mockConfig.get);

  const storage = new HistoryStorage({ group: 'test-group' });
  const history1 = new History(<any>{ id: '1', snapshot: {} });
  const history2 = new History(<any>{ id: '2', snapshot: {} });
  const history3 = new History(<any>{ id: '3', snapshot: {} });

  storage.register(history1);
  storage.register(history2);
  expect(storage.size).toBe(2);
  storage.register(history3);
  expect(storage.size).toBe(2);
  expect(storage.has('1')).toBe(false); // oldest entry should be removed
});
