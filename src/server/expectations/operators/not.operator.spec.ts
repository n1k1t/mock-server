import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './not.operator';

describe('Expectations.Operators.Not', () => {
  it('should validate by schema', () => {
    const schema: Parameters<typeof operator>[1] = {
      $has: { $location: 'query', $path: 'foo', $value: 1 },
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeFalsy();
  });
});
