import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Exec', () => {
  it('should exec by inline serialized command with utils', () => {
    const operator = new operators.$exec(operators, '_.set(context, "incoming.query.test", "foo")');
    const context = operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.query.test).toEqual('foo');
  });

  it('should exec by multiline serialized command', () => {
    const operator = new operators.$exec(operators, `{
      context.incoming.body.foo.push({ test: 1 });
      context.incoming.body.foo.push({ test: 2 });
    }`);

    const context = operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.body.foo[2].test).toEqual(1);
    expect(context.incoming.body.foo[3].test).toEqual(2);
  });

  it('should exec by function', () => {
    const operator = new operators.$exec<{ incoming: { query: { test: number } } }>(operators, ({ context }) => {
      context.incoming.query.test = 100;
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toEqual(100);
  });

  it('should exec by function with utils', () => {
    const operator = new operators.$exec<{ incoming: { query: { test: number } } }>(operators, ({ context, _ }) => {
      _.set(context, 'incoming.query.test', 100);
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toEqual(100);
  });
});
