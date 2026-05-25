import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Or', () => {
  describe('matching', () => {
    it('should match by schema with one valid condition', async () => {
      const operator = new operators.$or(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should match by schema with two valid conditions', async () => {
      const operator = new operators.$or(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: null } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should match by schema with zero conditions', async () => {
      const operator = new operators.$or(operators, []);

      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema with one valid and one invalid condition', async () => {
      const operator = new operators.$or(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: 1 } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should match by schema with two invalid conditions', async () => {
      const operator = new operators.$or(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: null } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: 1 } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBe(false);
    });
  });

  describe('manipulation', () => {
    it('should manipulate by schema with two conditions', async () => {
      const operator = new operators.$or<any>(operators, [
        { $set: { $location: 'incoming.headers', $path: 'content-length', $value: 100 } },
        { $set: { $location: 'incoming.query', $path: 'bar.baz', $value: { test: true } } },
      ]);

      const context = await operator.manipulate<any>(buildExpectationContext());

      expect(context.incoming).toMatchObject({
        headers: {
          'content-length': 100,
        },
        query: {
          bar: {
            baz: {
              test: true,
            },
          },
        },
      });
    });
  });
});
