import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.And', () => {
  describe('matching', () => {
    it('should match by schema with one valid condition', () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
      ]);

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with two valid conditions', () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: null } },
      ]);

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with zero conditions', () => {
      expect(new operators.$and(operators, []).match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with one valid and one invalid condition', () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: 1 } },
      ]);

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema with two invalid conditions', () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: null } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: 1 } },
      ]);

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });
  });

  describe('manipulation', () => {
    it('should manipulate by schema with two conditions', () => {
      const operator = new operators.$and<any>(operators, [
        { $set: { $location: 'incoming.headers', $path: 'content-length', $value: 100 } },
        { $set: { $location: 'incoming.query', $path: 'bar.baz', $value: { test: true } } },
      ]);

      const context = operator.manipulate<any>(buildExpectationContext());

      expect(context.incoming.headers?.['content-length']).toEqual(100);
      expect(context.incoming.query?.bar?.baz?.test).toBeTruthy();
    });
  });
});
