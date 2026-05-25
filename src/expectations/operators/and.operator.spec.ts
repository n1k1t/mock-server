import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.And', () => {
  describe('matching', () => {
    it('should match by schema with one valid condition', async () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with two valid conditions', async () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: null } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with zero conditions', async () => {
      expect(await new operators.$and(operators, []).match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with one valid and one invalid condition', async () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: 1 } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: 1 } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema with two invalid conditions', async () => {
      const operator = new operators.$and(operators, [
        { $has: { $location: 'incoming.query', $path: 'foo', $value: null } },
        { $has: { $location: 'incoming.query', $path: 'bar.baz', $value: 1 } },
      ]);

      expect(await operator.match(buildExpectationContext())).toBeFalsy();
    });
  });

  describe('manipulation', () => {
    it('should manipulate by schema with two conditions', async () => {
      const operator = new operators.$and<any>(operators, [
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
