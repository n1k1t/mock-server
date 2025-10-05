import RootExpectationOperator from './root.operator';

// Test generated using Keploy
test('should return false when compiled is null', () => {
  const mockOperators: any = {};
  const operator = new RootExpectationOperator(<any>{}, mockOperators);
  operator.compiled = null;  // Set compiled to null
  expect(operator.match(<any>{})).toBe(false);
});

// Test generated using Keploy
test('should return original context when compiled is null', () => {
  const mockOperators: any = {};
  const operator = new RootExpectationOperator(<any>{}, mockOperators);
  operator.compiled = null;  // Set compiled to null
  const context = { data: 'test' };
  expect(operator.manipulate(<any>context)).toBe(context);
});

// Test generated using Keploy
test('tags should return empty array if compiled is null', () => {
  const mockOperators: any = {};
  const operator = new RootExpectationOperator(<any>{}, mockOperators);
  operator.compiled = null;  // Set compiled to null
  expect(operator.tags).toEqual({});
});
