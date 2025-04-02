import { ConnectionError } from './connection.error'; // Ensure correct import path

// Test generated using Keploy
test('test_ConnectionError_customMessage_initialization', () => {
  const config = { /* Mock IRequestConfiguration object */ };
  const customMessage = 'Database connection failed';
  const error = new ConnectionError(config, customMessage);
  expect(error.message).toBe(`Cannot connect [${customMessage}]`);
  expect(error.configuration).toBe(config);
});
