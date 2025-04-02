import { ValidationError } from './validation.error';

// Test generated using Keploy
test('test_ValidationError_instantiation_message', () => {
  const config = { someConfig: 'value' }; // Mock IConfiguration
  const error = new ValidationError(<any>config);

  expect(error.message).toBe('Got validation error');
});
