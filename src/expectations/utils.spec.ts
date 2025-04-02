import { checkIsLocationInContext } from './utils';
import { extractContextByLocation } from './utils';
import { serializeExpectationSchema } from './utils';

// Test generated using Keploy
it('should return false for undefined location in context', () => {
  const context = { incoming: {} };
  const result = checkIsLocationInContext(<any>'nonexistent', <any>context);
  expect(result).toBe(false);
});

// Test generated using Keploy
it('should return expected context for valid path', () => {
  const context = {
    incoming: {
      path: '/api/test',
      method: 'GET',
    },
  };
  const result = extractContextByLocation('path', <any>context);
  expect(result).toEqual({
    key: 'incoming.path',
    type: 'string',
    parent: context,
    value: '/api/test',
  });
});

// Test generated using Keploy
it('should return null for invalid location', () => {
  const context = {};
  const result = extractContextByLocation(<any>'invalid.location', <any>context);
  expect(result).toBeNull();
});

// Test generated using Keploy
it('should serialize $exec functions in the schema', () => {
  const schema = {
    $exec: () => {},
    nested: {
      $exec: () => {},
      $has: {
        $exec: () => {},
      },
    },
  };
  const result = serializeExpectationSchema(schema);
  expect(result.nested.$exec).toBeDefined();
  expect(result.nested.$has.$exec).toBeDefined();
});

// Test generated using Keploy
it('should return correct context for method location', () => {
  const context = {
    incoming: {
      method: 'GET',
    },
  };
  const result = extractContextByLocation('method', <any>context);
  expect(result).toEqual({
    key: 'incoming.method',
    type: 'string',
    parent: context,
    value: 'GET',
  });
});

// Test generated using Keploy
it('should return correct context for outgoing.data location', () => {
  const context = {
    outgoing: {
      data: { key: 'value' },
    },
  };
  const result = extractContextByLocation('outgoing.data', <any>context);
  expect(result).toEqual({
    key: 'outgoing.data',
    type: 'object',
    parent: context,
    value: { key: 'value' },
  });
});
