import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Merge', () => {
  it('should handle schema with non object payload', () => {
    const operator = new operators.$merge<any, any>(operators, {
      $location: 'path',
      $value: true,
    });

    const context = operator.manipulate({ incoming: { path: 'test' } });
    expect(context.incoming.path).toEqual('test');
  });

  it('should manipulate by schema', () => {
    const operator = new operators.$merge(operators, {
      $location: 'incoming.query',
      $value: { test: true },
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using path', () => {
    const operator = new operators.$merge(operators, {
      $location: 'incoming.query',
      $path: 'bar',
      $value: { test: true },
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.bar.test).toBeTruthy();
  });

  it('should manipulate by schema using jsonPath', () => {
    const operator = new operators.$merge(operators, {
      $location: 'incoming.body',
      $jsonPath: '$.foo[*]',
      $value: { test: true },
    });

    const context = operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.body.foo[0].test).toBeTruthy();
    expect(context.incoming.body.foo[1].test).toBeTruthy();
  });
});
