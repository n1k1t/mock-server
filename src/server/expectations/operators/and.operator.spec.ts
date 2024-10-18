import { buildExpectationContext } from '../__utils__';
import { exploreNestedExpectationSchema } from '../utils';

import operator from './and.operator';

describe('Expectations.Operators.And', () => {
  describe('validation mode', () => {
    it('should validate by schema with one valid condition', () => {
      const schema: Parameters<typeof operator>[1] = [
        { $has: { $location: 'query', $path: 'foo', $value: 1 } },
      ];

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeTruthy();
    });

    it('should validate by schema with two valid conditions', () => {
      const schema: Parameters<typeof operator>[1] = [
        { $has: { $location: 'query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'query', $path: 'bar.baz', $value: null } },
      ];

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeTruthy();
    });

    it('should validate by schema with zero conditions', () => {
      expect(
        operator('validation', [], buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeTruthy();
    });

    it('should validate by schema with one valid and one invalid condition', () => {
      const schema: Parameters<typeof operator>[1] = [
        { $has: { $location: 'query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'query', $path: 'bar.baz', $value: 1 } },
      ];

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeFalsy();
    });

    it('should validate by schema with two invalid conditions', () => {
      const schema: Parameters<typeof operator>[1] = [
        { $has: { $location: 'query', $path: 'foo', $value: null } },
        { $has: { $location: 'query', $path: 'bar.baz', $value: 1 } },
      ];

      expect(
        operator('validation', schema, buildExpectationContext(), { exploreNestedSchema: exploreNestedExpectationSchema })
      ).toBeFalsy();
    });
  });

  describe('manipulation mode', () => {
    it('should manipulate by schema with two conditions', () => {
      const context = buildExpectationContext();
      const schema: Parameters<typeof operator>[1] = [
        { $set: { $location: 'headers', $path: 'content-length', $value: 100 } },
        { $set: { $location: 'query', $path: 'bar.baz', $value: { test: true } } },
      ];

      expect(operator('manipulation', schema, context, { exploreNestedSchema: exploreNestedExpectationSchema })).toBeTruthy();
      expect(context.headers?.['content-length']).toEqual(100);
      expect((<any>context.query)?.bar?.baz?.test).toBeTruthy();
    });
  });
});
