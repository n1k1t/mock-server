import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Merge', () => {
  it('should handle schema with non object payload', async () => {
    const operator = new operators.$merge<any, any>(operators, {
      $location: 'path',
      $value: true,
    });

    const context = await operator.manipulate({ incoming: { path: 'test' } });
    expect(context.incoming.path).toEqual('test');
  });

  it('should manipulate by schema', async () => {
    const operator = new operators.$merge(operators, {
      $location: 'incoming.query',
      $value: { test: true },
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.test).toBeTruthy();
  });

  it('should manipulate by schema using path', async () => {
    const operator = new operators.$merge(operators, {
      $location: 'incoming.query',
      $path: 'bar',
      $value: { test: true },
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.bar.test).toBeTruthy();
  });

  it('should manipulate by schema using jsonPath', async () => {
    const operator = new operators.$merge(operators, {
      $location: 'incoming.data',
      $jsonPath: '$.foo[*]',
      $value: { test: true },
    });

    const context = await operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.data.foo.map((item: any) => item.test)).toEqual([true, true]);
  });
});
