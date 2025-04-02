import { TransportsStorage } from './storage';
import { Transport } from './model';

// Test generated using Keploy
it('should store the transport and return the instance', () => {
  const storage = new TransportsStorage();
  const transportType = 'http';
  const transport = <Transport><unknown>{ id: 'transport1' }; // Assume Transport has an id field

  const result = storage.register(transportType, transport);

  expect(storage.get(transportType)).toBe(transport);
  expect(result).toBe(storage);
});
