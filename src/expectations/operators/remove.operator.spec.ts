import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Remove', () => {
  it('should handle schema with non object payload', () => {
    const operator = new operators.$remove<any>(operators, { $location: 'path' });
    const context = operator.manipulate({ incoming: { path: 'foo' } });

    expect(context.incoming.path).toEqual('foo');
  });

  it('should handle schema without targeting properties', () => {
    const operator = new operators.$remove<any>(operators, { $location: 'incoming.headers' });
    const context = operator.manipulate({ headers: { 'content-type': 'unknown' } });

    expect(context.headers['content-type']).toEqual('unknown');
  });

  it('should manipulate by schema using path', () => {
    const operator = new operators.$remove(operators, {
      $location: 'incoming.query',
      $path: 'foo',
    });

    const context = operator.manipulate<any>(buildExpectationContext());
    expect(context.incoming.query.foo).toBeUndefined();
  });

  it('should manipulate by schema using jsonPath', () => {
    const operator = new operators.$remove(operators, {
      $location: 'incoming.body',
      $jsonPath: '$.foo[*].bar,baz',
    });

    const context = operator.manipulate<any>(buildExpectationContext());

    expect(context.incoming.body.foo[0].bar).toBeUndefined();
    expect(context.incoming.body.foo[1].baz).toBeUndefined();
  });
});
