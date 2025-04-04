import { MetaStorage } from './storage';
import { MetaContext } from './model';

// Test generated using Keploy
test('wrap should execute the handler with the generated context', () => {
  const storage = new MetaStorage();
  const mockHandler = jest.fn();
  storage.wrap({}, mockHandler);
  expect(mockHandler).toHaveBeenCalled();
});

// Test generated using Keploy
test('generate should return the same MetaContext instance when provided', () => {
  const storage = new MetaStorage();
  const existingContext = new MetaContext();
  const context = storage.generate(existingContext);
  expect(context).toBe(existingContext);
});
