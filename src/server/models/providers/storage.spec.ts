import { ProvidersStorage } from './storage';
import { MockServer } from '../../index';
import { Provider } from './model';

// Test generated using Keploy
test('extract returns all providers including default', () => {
  const mockServer = <MockServer<any, any>>{};
  const storage = new ProvidersStorage(mockServer);
  const provider1 = Provider.build({ group: 'group1' });
  const provider2 = Provider.build({ group: 'group2' });

  storage.register(provider1);
  storage.register(provider2);

  const result = storage.extract();

  expect(result).toHaveLength(3); // Two registered + one default
  expect(result).toContainEqual(provider1);
  expect(result).toContainEqual(provider2);
  expect(result).toContainEqual(storage.default);
});
