import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './if.operator';

describe('Expectations.Operators.If', () => {
  describe('validation mode', () => {
    it('should validate by schema with simple valid condition and valid [then] target branch', () => {
      const schema: Parameters<typeof operator>[1] = {
        $has: { $location: 'path', $regExp: /^\/foo/ },
        $then: { $has: { $location: 'method', $value: 'POST' } },
      };

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeTruthy();
    });

    it('should validate by schema with simple invalid condition and valid [then] target branch', () => {
      const schema: Parameters<typeof operator>[1] = {
        $has: { $location: 'path', $regExp: /^\/bar/ },
        $then: { $has: { $location: 'method', $value: 'POST' } },
      };

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeFalsy();
    });

    it('should validate by schema with simple valid condition and invalid [then] target branch', () => {
      const schema: Parameters<typeof operator>[1] = {
        $has: { $location: 'path', $regExp: /^\/foo/ },
        $then: { $has: { $location: 'method', $value: 'GET' } },
      };

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeFalsy();
    });

    it('should validate by schema with simple invalid condition and valid [else] target branch', () => {
      const schema: Parameters<typeof operator>[1] = {
        $has: { $location: 'path', $regExp: /^\/bar/ },
        $else: { $has: { $location: 'method', $value: 'POST' } },
      };

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeTruthy();
    });

    it('should validate by schema with simple invalid condition and invalid [else] target branch', () => {
      const schema: Parameters<typeof operator>[1] = {
        $has: { $location: 'path', $regExp: /^\/bar/ },
        $else: { $has: { $location: 'method', $value: 'GET' } },
      };

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeFalsy();
    });

    it('should validate by schema with complex valid condition', () => {
      const schema: Parameters<typeof operator>[1] = {
        $or: [
          { $if: {} },
          { $has: { $location: 'path', $regExp: /^\/bar/ } },
          { $has: { $location: 'method', $value: 'POST'} },
        ],

        $then: {
          $or: [
            { $has: { $location: 'body', $path: 'foo.1.test.0', $regExp: /^2/ } },
            { $has: { $location: 'body', $path: 'foo.1.baz.0', $regExp: /^2/ } },
          ],
        },
      };

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeTruthy();
    });

    it('should validate by schema with complex invalid condition', () => {
      const schema: Parameters<typeof operator>[1] = {
        $or: [
          { $if: {} },
          { $has: { $location: 'path', $regExp: /^\/bar/ } },
          { $has: { $location: 'method', $value: 'GET'} },
        ],

        $else: {
          $has: { $location: 'body', $path: 'foo.1.test.0', $regExp: /^2/ },
        },
      };

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeFalsy();
    });
  });

  describe('manipulation mode', () => {
    it('should manipulate by schema with conplex condition', () => {
      const context = buildExpectationContext();
      const schema: Parameters<typeof operator>[1] = {
        $or: [
          { $if: {} },
          { $has: { $location: 'path', $regExp: /^\/bar/ } },
          { $has: { $location: 'method', $value: 'POST'} },
        ],

        $then: {
          $and: [
            { $set: { $location: 'headers', $path: 'content-length', $value: 100 } },
            { $set: { $location: 'query', $path: 'bar.baz', $value: { test: true } } },
          ],
        },
      };

      expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
      expect(context.headers?.['content-length']).toEqual(100);
      expect((<any>context.query)?.bar?.baz?.test).toBeTruthy();
    });
  });
});
