import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Has', () => {
  describe('incoming.query', () => {
    it('should handle invalid schema', async () => {
      const operator = new operators.$has(operators, { $location: 'incoming.query' });
      expect(await operator.match(<any>{})).toBe(false);
    });

    it('should match by schema using exec', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $exec: (payload) => payload.foo === 1,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using exec', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $exec: (payload) => payload.foo === '2',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo1',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path and value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $value: 1,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path and value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $value: 2,
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path and valueAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $valueAnyOf: [null, 500, 1],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path and valueAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $valueAnyOf: [],
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path and regExp', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExp: /\d/,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path and regExp', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExp: /[a-z]/,
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path and regExpAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExpAnyOf: [/\./, /\d/],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path and regExpAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExpAnyOf: [/\./],
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path and match', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $match: '*',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path and match', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $match: '*foo*',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path and matchAnyOf', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $matchAnyOf: ['2', '3', '1'],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path and matchAnyOf', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $matchAnyOf: ['*2', '3', '1*0'],
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using path and exec', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $exec: (payload) => payload === 1,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using path and exec', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $exec: (payload) => payload === '2',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using jsonPath', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using jsonPath', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar2.baz',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using jsonPath and value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $value: null,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema with using jsonPath and value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $value: 1,
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using jsonPath and valueAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $valueAnyOf: [1, 2, null],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using jsonPath and valueAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $valueAnyOf: [1, 2, 3],
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using jsonPath and exec', async () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $exec: (payload) => payload === null,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using jsonPath and exec', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $exec: (payload) => payload === 1,
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });
  });

  describe('incoming.data', () => {
    it('should match by schema using match', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.data',
        $match: { foo: { bar: 1 } },
      });
      const results = await Promise.all([
        operator.match({ incoming: { data: { foo: { bar: 1 } } } }),
        operator.match({ incoming: { data: { foo: { bar: 2 } } } }),
        operator.match({ incoming: { data: {} } }),
      ]);
      expect(results).toEqual([true, false, false]);
    });

    it('should match by schema using matchAnyOf', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.data',
        $matchAnyOf: [{ foo: { bar: 1 } }, { baz: 2 }],
      });
      expect(await operator.match({ incoming: { data: { foo: { bar: 1 } } } })).toBe(true);
    });
  });

  describe('incoming.path', () => {
    it('should match by schema using value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $value: '/foo/bar/baz',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should match by schema using valueAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $valueAnyOf: ['/foo', '/bar', '/foo/bar/baz'],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should match by schema using regExp', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $regExp: /^\/foo\/\w+\/baz$/,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should match by schema using regExpAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $regExpAnyOf: [/\./, /^\/foo\/\w+\/baz$/, /^foo$/],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should match by schema using match', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $match: '/foo/*/baz',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using match', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $match: '/foo/*/*/baz',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using matchAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $matchAnyOf: ['/foo/baz', '/bar/baz', '/foo/bar/*'],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using matchAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $matchAnyOf: [],
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using exec', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $exec: (payload) => payload.includes('/foo'),
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using exec', async () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $exec: (payload) => payload === '/foo',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });
  });

  describe('incoming.method', () => {
    it('should match by schema using value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'method',
        $value: 'POST',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });
  });

  describe('outgoing.status', () => {
    it('should match by schema using value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $value: 200,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using value', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $value: 201,
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using valueAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $valueAnyOf: [404, 200],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using valueAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $valueAnyOf: [404, 201],
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using match', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $match: '2**',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using match', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $match: '2*1',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using matchAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $matchAnyOf: ['2*1', '200'],
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using matchAnyOf', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $matchAnyOf: ['2*1'],
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using exec', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: (payload) => payload === 200,
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using exec', async () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'outgoing.status',
        $exec: (payload) => payload === '200',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using exec as string', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: 'payload === 200',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });

    it('should not match by schema using exec as string', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: 'payload === 201',
      });
      expect(await operator.match(buildExpectationContext())).toBe(false);
    });

    it('should match by schema using exec as string with utils', async () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: '_.isEqual(payload, 200)',
      });
      expect(await operator.match(buildExpectationContext())).toBe(true);
    });
  });
});
