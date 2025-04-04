import { serializeExpectationSchema } from './schema';

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
