import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Set', () => {
  it('should manipulate by schema in outgoing.status', async () => {
    const operator = new operators.$set(operators, {
      $location: 'outgoing.status',
      $value: 404,
    });

    const context = await operator.manipulate(buildExpectationContext());
    expect(context.outgoing?.status).toEqual(404);
  });

  it('should manipulate by schema in incoming.headers', async () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.headers',
      $path: 'a.b.c.d',
      $value: 'test',
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.headers.a.b.c.d).toEqual('test');
  });

  it('should manipulate by schema in incoming.data using jsonPath', async () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.data',
      $jsonPath: '$.foo[*].bar,baz',
      $value: { test: true },
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect([context.incoming.data.foo[0].bar.test, context.incoming.data.foo[1].baz.test]).toEqual([true, true]);
  });

  it('should manipulate by schema in incoming.query', async () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.query',
      $value: { test: true },
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using path and exec as function', async () => {
    const operator = new operators.$set<any>(operators, {
      $location: 'incoming.query',
      $path: 'foo',
      $exec: (payload) => payload + 1,
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.foo).toEqual(2);
  });

  it('should manipulate by schema using exec as function', async () => {
    const operator = new operators.$set<any>(operators, {
      $location: 'incoming.query',
      $path: 'test',
      $exec: () => true,
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using exec as string', async () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.query',
      $path: 'test',
      $exec: 'true',
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using exec as string with utils', async () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.query',
      $path: 'test',
      $exec: '_.isEqual({}, {})',
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });
});
