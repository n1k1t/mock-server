import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Set', () => {
  it('should manipulate by schema in outgoing.status', () => {
    const operator = new operators.$set(operators, {
      $location: 'outgoing.status',
      $value: 404,
    });

    const context = operator.manipulate(buildExpectationContext());
    expect(context.outgoing?.status).toEqual(404);
  });

  it('should manipulate by schema in incoming.headers', () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.headers',
      $path: 'a.b.c.d',
      $value: 'test',
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.headers.a.b.c.d).toEqual('test');
  });

  it('should manipulate by schema in incoming.body using jsonPath', () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.body',
      $jsonPath: '$.foo[*].bar,baz',
      $value: { test: true },
    });

    const context = operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.body.foo[0].bar.test).toBeTruthy();
    expect(context.incoming.body.foo[1].baz.test).toBeTruthy();
  });

  it('should manipulate by schema in incoming.query', () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.query',
      $value: { test: true },
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using path and exec as function', () => {
    const operator = new operators.$set<any>(operators, {
      $location: 'incoming.query',
      $path: 'foo',

      $exec: (payload) => payload + 1,
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.foo).toEqual(2);
  });

  it('should manipulate by schema using exec as function', () => {
    const operator = new operators.$set<any>(operators, {
      $location: 'incoming.query',
      $path: 'test',

      $exec: () => true,
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using exec as string', () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.query',
      $path: 'test',

      $exec: 'true',
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using exec as string with utils', () => {
    const operator = new operators.$set(operators, {
      $location: 'incoming.query',
      $path: 'test',

      $exec: '_.isEqual({}, {})',
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });
});
