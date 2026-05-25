import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Remove', () => {
  it('should handle schema with non object payload', async () => {
    const operator = new operators.$remove<any>(operators, { $location: 'path' });
    const context = await operator.manipulate({ incoming: { path: 'foo' } });

    expect(context.incoming.path).toEqual('foo');
  });

  it('should handle schema without targeting properties', async () => {
    const operator = new operators.$remove<any>(operators, { $location: 'incoming.headers' });
    const context = await operator.manipulate({ headers: { 'content-type': 'unknown' } });

    expect(context.headers['content-type']).toEqual('unknown');
  });

  it('should manipulate by schema using path', async () => {
    const operator = new operators.$remove(operators, {
      $location: 'incoming.query',
      $path: 'foo',
    });

    const context = await operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.query.foo).toBeUndefined();
  });

  it('should manipulate by schema using jsonPath', async () => {
    const operator = new operators.$remove(operators, {
      $location: 'incoming.data',
      $jsonPath: '$.foo[*].bar,baz',
    });

    const context = await operator.manipulate<any>(buildExpectationContext());

    expect({
      bar: context.incoming.data.foo[0].bar,
      baz: context.incoming.data.foo[1].baz,
    }).toEqual({
      bar: undefined,
      baz: undefined,
    });
  });
});
