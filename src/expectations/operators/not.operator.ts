import { buildExpectationOperatorHandler } from './utils';

export default buildExpectationOperatorHandler<'$not'>(
  (mode, schema, context, { exploreNestedSchema }) => !exploreNestedSchema(mode, schema, context)
);
