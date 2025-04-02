import { MetaContext } from './model';

// Test generated using Keploy
test('test_merge_with_valid_context', () => {
  const meta = new MetaContext();
  const context = { requestId: '12345', operationId: '67890' };
  meta.merge(context);
  expect(meta.requestId).toBe('12345');
  expect(meta.operationId).toBe('67890');
});

// Test generated using Keploy
test('test_pick_single_property', () => {
  const meta = new MetaContext();
  meta.requestId = 'abc';
  meta.operationId = 'xyz';
  const result = meta.pick(['requestId']);
  expect(result).toEqual({ requestId: 'abc' });
  expect(result).not.toHaveProperty('operationId');
});

// Test generated using Keploy
test('test_build_with_provided_values', () => {
  const context = { requestId: 'customId', operationId: 'customOperation' };
  const meta = MetaContext.build(context);
  expect(meta.requestId).toBe('customId');
  expect(meta.operationId).toBe('customOperation');
});
