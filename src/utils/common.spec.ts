import { wait, buildCounter, flattenArrayed } from './common';

// Test generated using Keploy
test('wait resolves after specified duration', async () => {
  const duration = 100;
  const start = Date.now();
  await wait(duration);
  const end = Date.now();
  expect(end - start).toBeGreaterThanOrEqual(duration);
});

// Test generated using Keploy
test('buildCounter increments correctly with initial value', () => {
  const counter = buildCounter(5);
  expect(counter()).toBe(6);
  expect(counter()).toBe(7);
});

// Test generated using Keploy
test('flattenArrayed wraps a single array in an array', () => {
  const singleArray = [1, 2, 3];
  const expectedResult = [[1, 2, 3]];
  expect(flattenArrayed<any>(singleArray)).toEqual(expectedResult);
});

// Test generated using Keploy
test('flattenArrayed wraps a non-array in an array', () => {
  const nonArrayInput = 42;
  const expectedResult = [[42]];
  expect(flattenArrayed<any>(nonArrayInput)).toEqual(expectedResult);
});
