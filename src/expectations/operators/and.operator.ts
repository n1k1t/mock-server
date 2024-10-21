import { buildExpectationOperatorHandler } from './utils';

export default buildExpectationOperatorHandler<'$and'>(
  (mode, schema, context, { exploreNestedSchema }) =>
    schema.every((configuration) => exploreNestedSchema(mode, configuration, context))
);
