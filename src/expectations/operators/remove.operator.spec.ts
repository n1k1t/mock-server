import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './remove.operator';

describe('Expectations.Operators.Remove', () => {
  it('should handle invalid payload', () => {
    const schema: Parameters<typeof operator>[1] = { $location: 'query' };
    expect(operator('manipulation', schema, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should handle schema without location', () => {
    expect(operator('manipulation', {}, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should handle schema with non object payload', () => {
    const schema: Parameters<typeof operator>[1] = { $location: 'path' };
    expect(operator('manipulation', schema, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should handle schema without targeting properties', () => {
    const schema: Parameters<typeof operator>[1] = { $location: 'headers' };
    expect(operator('manipulation', schema, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
  });

  it('should manipulate by schema using path', () => {
    const context = buildExpectationContext();
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'foo',
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.query).foo).toBeUndefined();
  });

  it('should manipulate by schema using jsonPath', () => {
    const context = buildExpectationContext();
    const schema: Parameters<typeof operator>[1] = {
      $location: 'body',
      $jsonPath: '$.foo[*].bar,baz',
    };

    expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
    expect((<any>context.body).foo[0].bar).toBeUndefined();
    expect((<any>context.body).foo[1].baz).toBeUndefined();
  });
});
