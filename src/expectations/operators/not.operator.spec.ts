import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Not', () => {
  it('should match by schema', () => {
    const operator = new operators.$not(operators, {
      $has: { $location: 'incoming.query', $path: 'foo', $value: 1 },
    });

    expect(operator.match(buildExpectationContext())).toBeFalsy();
  });
});
