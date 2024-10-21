import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './set.operator';

describe('Expectations.Operators.Set', () => {
  it('should handle invalid payload', () => {
    const schema: Parameters<typeof operator>[1] = { $location: 'query' };
    expect(operator('manipulation', schema, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should handle schema without location', () => {
    expect(operator('manipulation', {}, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should manipulate by schema in statusCode', () => {
    const context = buildExpectationContext()
    const schema: Parameters<typeof operator>[1] = {
      $location: 'statusCode',
      $value: 404,
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect(context.statusCode).toEqual(404);
  });

  it('should manipulate by schema in headers', () => {
    const context = buildExpectationContext()
    const schema: Parameters<typeof operator>[1] = {
      $location: 'headers',
      $path: 'a.b.c.d',
      $value: 'test',
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.headers).a.b.c.d).toEqual('test');
  });

  it('should manipulate by schema in body using jsonPath', () => {
    const context = buildExpectationContext()
    const schema: Parameters<typeof operator>[1] = {
      $location: 'body',
      $jsonPath: '$.foo[*].bar,baz',
      $value: { test: true },
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();

    expect((<any>context.body).foo[0].bar.test).toBeTruthy();
    expect((<any>context.body).foo[1].baz.test).toBeTruthy();
  });

  it('should manipulate by schema in root of query', () => {
    const context = buildExpectationContext()
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $value: { test: true },
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.query).test).toBeTruthy();
  });
});
