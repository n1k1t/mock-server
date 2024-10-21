import { buildExpectationOperatorHandler } from './utils';

export default buildExpectationOperatorHandler<'$if'>((mode, schema, context, { exploreNestedSchema }) => {
  const { $then, $else, ...schemaPart } = schema;
  const result = exploreNestedSchema(mode, schemaPart, context);

  if ($then && result) {
    return exploreNestedSchema(mode, $then, context);
  }
  if ($else && !result) {
    return exploreNestedSchema(mode, $else, context);
  }

  return false;
});
