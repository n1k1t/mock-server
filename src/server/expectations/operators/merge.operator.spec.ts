import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './merge.operator';

describe('Expectations.Operators.Merge', () => {
  it('should handle invalid payload', () => {
    const schema: Parameters<typeof operator>[1] = { $location: 'query' };
    expect(operator('manipulation', schema, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should handle schema without location', () => {
    expect(operator('manipulation', {}, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should handle schema with non object payload', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'path',
      $value: true,
    };

    expect(operator('manipulation', schema, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should manipulate by schema', () => {
    const context = buildExpectationContext()
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $value: { test: true },
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.query).test).toBeTruthy();
  });

  it('should manipulate by schema using path', () => {
    const context = buildExpectationContext()
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'bar',
      $value: { test: true },
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.query).bar.test).toBeTruthy();
  });

  it('should manipulate by schema using jsonPath', () => {
    const context = buildExpectationContext()
    const schema: Parameters<typeof operator>[1] = {
      $location: 'body',
      $jsonPath: '$.foo[*]',
      $value: { test: true },
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.body).foo[0].test).toBeTruthy();
    expect((<any>context.body).foo[1].test).toBeTruthy();
  });
});
