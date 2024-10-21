import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './has.operator';

describe('Expectations.Operators.Has', () => {
  it('should handle invalid payload', () => {
    const schema: Parameters<typeof operator>[1] = { $location: 'query' };
    expect(operator('validation', schema, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeFalsy();
  });

  it('should handle schema without location', () => {
    expect(operator('validation', {}, <any>{}, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeFalsy();
  });

  it('should validate by schema in query using path', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'foo',
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using path and value', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'foo',
      $value: 1,
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using jsonPath and valueAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $jsonPath: '$.bar.baz',
      $valueAnyOf: [1, 2, null],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using path and regExp', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'foo',
      $regExp: /\d/,
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using path and regExpAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'foo',
      $regExpAnyOf: [/\./, /\d/],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using path and minimatch', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'foo',
      $minimatch: '*',
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using path and minimatchAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $path: 'foo',
      $minimatchAnyOf: ['2', '3', '1'],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using jsonPath', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $jsonPath: '$.bar.baz',
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in query using jsonPath and value', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $jsonPath: '$.bar.baz',
      $value: null,
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema with invalid condition in query using jsonPath and value', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'query',
      $jsonPath: '$.bar.baz',
      $value: 1,
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeFalsy();
  });

  it('should validate by schema in path using value', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'path',
      $value: '/foo/bar/baz',
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in path using valueAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'path',
      $valueAnyOf: ['/foo', '/bar', '/foo/bar/baz'],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in path using regExp', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'path',
      $regExp: /^\/foo\/\w+\/baz$/,
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in path using regExpAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'path',
      $regExpAnyOf: [/\./, /^\/foo\/\w+\/baz$/, /^foo$/],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in path using minimatch', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'path',
      $minimatch: '/foo/*/baz',
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in path using minimatchAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'path',
      $minimatchAnyOf: ['/foo/baz', '/bar/baz', '/foo/bar/*'],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in method using value', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'method',
      $value: 'POST',
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in statusCode using value', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'statusCode',
      $value: 200,
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in statusCode using valueAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'statusCode',
      $valueAnyOf: [404, 200],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in statusCode using minimatch', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'statusCode',
      $minimatch: '2**',
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });

  it('should validate by schema in statusCode using minimatchAnyOf', () => {
    const schema: Parameters<typeof operator>[1] = {
      $location: 'statusCode',
      $minimatchAnyOf: ['2*1', '200'],
    };

    expect(
      operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
    ).toBeTruthy();
  });
});
