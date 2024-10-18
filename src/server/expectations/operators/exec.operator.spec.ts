import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './exec.operator';

describe('Expectations.Operators.Exec', () => {
  it('should exec by inline command', () => {
    const context = buildExpectationContext()
    const command = '_.set(context, "query.test", "foo")';

    expect(operator('manipulation', command, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.query).test).toEqual('foo');
  });

  it('should exec by multiline command', () => {
    const context = buildExpectationContext()
    const command = `{
      context.body.foo.push({ test: 1 });
      context.body.foo.push({ test: 2 });
    }`;

    expect(operator('manipulation', command, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.body).foo[2].test).toEqual(1);
    expect((<any>context.body).foo[3].test).toEqual(2);
  });
});
