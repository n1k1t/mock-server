import { ExecutorManualError } from '../errors';

// Test generated using Keploy
test('should initialize error message with the provided code', () => {
  const errorCode = 'MANUAL_ERROR';
  const error = new ExecutorManualError(<any>errorCode);
  expect(error.message).toBe(`Executor manual error [${errorCode}]`);
});

// Test generated using Keploy
test('should return true when the code matches', () => {
  const errorCode = 'ERROR_CODE';
  const error = new ExecutorManualError(<any>errorCode);
  expect(error.is(<any>errorCode)).toBe(true);
});

// Test generated using Keploy
test('should create an instance with the correct code', () => {
  const errorCode = 'BUILD_ERROR';
  const error = ExecutorManualError.build(<any>errorCode);
  expect(error instanceof ExecutorManualError).toBe(true);
  expect(error.code).toBe(errorCode);
});
