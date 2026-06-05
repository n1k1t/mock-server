import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.If', () => {
  describe('matching', () => {
    it('should match by schema with simple valid condition and valid [then] target branch', async () => {
      const operator = new operators.$if(operators, {
        $condition: { $has: { $location: 'path', $regExp: /^\/foo/ } },
        $then: { $has: { $location: 'method', $value: 'POST' } },
      });

      expect(await operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with simple invalid condition and valid [then] target branch', async () => {
      const operator = new operators.$if(operators, {
        $condition: { $has: { $location: 'path', $regExp: /^\/bar/ } },
        $then: { $has: { $location: 'method', $value: 'POST' } },
      });

      expect(await operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema with simple valid condition and invalid [then] target branch', async () => {
      const operator = new operators.$if(operators, {
        $condition: { $has: { $location: 'path', $regExp: /^\/foo/ } },
        $then: { $has: { $location: 'method', $value: 'GET' } },
      });

      expect(await operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema with simple invalid condition and valid [else] target branch', async () => {
      const operator = new operators.$if(operators, {
        $condition: { $has: { $location: 'path', $regExp: /^\/bar/ } },
        $else: { $has: { $location: 'method', $value: 'POST' } },
      });

      expect(await operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with simple invalid condition and invalid [else] target branch', async () => {
      const operator = new operators.$if(operators, {
        $condition: { $has: { $location: 'path', $regExp: /^\/bar/ } },
        $else: { $has: { $location: 'method', $value: 'GET' } },
      });

      expect(await operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema with complex valid condition', async () => {
      const operator = new operators.$if(operators, {
        $condition: {
          $or: [
            { $if: { $condition: {} } },
            { $has: { $location: 'path', $regExp: /^\/bar/ } },
            { $has: { $location: 'method', $value: 'POST' } },
          ],
        },

        $then: {
          $or: [
            { $has: { $location: 'incoming.data', $path: 'foo.1.test.0', $regExp: /^2/ } },
            { $has: { $location: 'incoming.data', $path: 'foo.1.baz.0', $regExp: /^2/ } },
          ],
        },
      });

      expect(await operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema with complex invalid condition', async () => {
      const operator = new operators.$if(operators, {
        $condition: {
          $or: [
            { $if: { $condition: {} } },
            { $has: { $location: 'path', $regExp: /^\/bar/ } },
            { $has: { $location: 'method', $value: 'GET' } },
          ],
        },

        $else: {
          $has: { $location: 'incoming.data', $path: 'foo.1.test.0', $regExp: /^2/ },
        },
      });

      expect(await operator.match(buildExpectationContext())).toBeFalsy();
    });
  });

  describe('manipulation', () => {
    it('should manipulate by schema with conplex condition', async () => {
      const operator = new operators.$if<any>(operators, {
        $condition: {
          $or: [
            { $if: { $condition: {} } },
            { $has: { $location: 'path', $regExp: /^\/bar/ } },
            { $has: { $location: 'method', $value: 'POST' } },
          ],
        },

        $then: {
          $and: [
            { $set: { $location: 'incoming.headers', $path: 'content-length', $value: 100 } },
            { $set: { $location: 'incoming.query', $path: 'bar.baz', $value: { test: true } } },
          ],
        },
      });

      const context = await operator.manipulate<any>(buildExpectationContext());

      expect(context.incoming.headers?.['content-length']).toEqual(100);
      expect(context.incoming.query.bar?.baz?.test).toBeTruthy();
    });
  });
});
