import { buildExpectationContext } from '../__utils__';
import { IExpectationSchemaContext } from '../types';

import * as operators from './index';

describe('Expectations.Operators.Exec', () => {
  it('should exec by inline serialized command with utils', async () => {
    const operator = new operators.$exec(operators, '_.set(context, "incoming.query.test", "foo")');
    const context = await operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.query.test).toEqual('foo');
  });

  it('should exec by multiline serialized command', async () => {
    const operator = new operators.$exec(
      operators,
      `{
        context.incoming.data.foo.push({ test: 1 });
        context.incoming.data.foo.push({ test: 2 });
      }`,
    );
    const context = await operator.manipulate<any>(buildExpectationContext());

    expect([context.incoming.data.foo[2].test, context.incoming.data.foo[3].test]).toEqual([1, 2]);
  });

  it('should exec by function', async () => {
    const operator = new operators.$exec<
      IExpectationSchemaContext<{
        incoming: { query: { test: number } };
      }>
    >(operators, ({ context }) => {
      context.incoming.query.test = 100;
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toEqual(100);
  });

  it('should exec by function with utils', async () => {
    const operator = new operators.$exec<
      IExpectationSchemaContext<{
        incoming: { query: { test: number } };
      }>
    >(operators, ({ context, _ }) => {
      _.set(context, 'incoming.query.test', 100);
    });
    const context = await operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.query.test).toEqual(100);
  });
});
