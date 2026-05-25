import RootExpectationOperator from './root.operator';

test('should return false when compiled is null', async () => {
  const mockOperators: any = {};
  const operator = new RootExpectationOperator(<any>{}, mockOperators);
  operator.compiled = null;
  const result = await operator.match(<any>{});
  expect(result).toBe(false);
});

test('should return original context when compiled is null', async () => {
  const mockOperators: any = {};
  const operator = new RootExpectationOperator(<any>{}, mockOperators);
  operator.compiled = null;
  const context = { data: 'test' };
  const result = await operator.manipulate(<any>context);
  expect(result).toBe(context);
});

test('tags should return empty array if compiled is null', () => {
  const mockOperators: any = {};
  const operator = new RootExpectationOperator(<any>{}, mockOperators);
  operator.compiled = null;  // Set compiled to null
  expect(operator.tags).toEqual({});
});
