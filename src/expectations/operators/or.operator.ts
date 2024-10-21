import { buildExpectationOperatorHandler } from './utils';

export default buildExpectationOperatorHandler<'$or'>(
  (mode, schema, context, { exploreNestedSchema }) =>
    schema.length && mode === 'validation'
      ? schema.some((segment) => exploreNestedSchema(mode, segment, context))
      : mode === 'manipulation'
      ? schema.every((segment) => exploreNestedSchema(mode, segment, context))
      : true
);
