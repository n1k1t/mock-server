import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Has', () => {
  describe('incoming.query', () => {
    it('should handle invalid schema', () => {
      const operator = new operators.$has(operators, { $location: 'incoming.query' });
      expect(operator.match(<any>{})).toBeFalsy();
    });

    it('should match by schema using exec', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $exec: (payload) => payload.foo === 1,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using exec', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $exec: (payload) => payload.foo === '2',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo1',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path and value', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $value: 1,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path and value', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $value: 2,
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path and valueAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $valueAnyOf: [null, 500, 1],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path and valueAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $valueAnyOf: [],
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path and regExp', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExp: /\d/,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path and regExp', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExp: /[a-z]/,
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path and regExpAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExpAnyOf: [/\./, /\d/],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path and regExpAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $regExpAnyOf: [/\./],
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path and match', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $match: '*',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path and match', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $match: '*foo*',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path and matchAnyOf', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $matchAnyOf: ['2', '3', '1'],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path and matchAnyOf', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $matchAnyOf: ['*2', '3', '1*0'],
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using path and exec', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $exec: (payload) => payload === 1,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using path and exec', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $path: 'foo',
        $exec: (payload) => payload === '2',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using jsonPath', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using jsonPath', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar2.baz',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using jsonPath and value', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $value: null,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema with using jsonPath and value', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $value: 1,
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using jsonPath and valueAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $valueAnyOf: [1, 2, null],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using jsonPath and valueAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $valueAnyOf: [1, 2, 3],
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using jsonPath and exec', () => {
      const operator = new operators.$has(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $exec: (payload) => payload === null,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using jsonPath and exec', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.query',
        $jsonPath: '$.bar.baz',
        $exec: (payload) => payload === 1,
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });
  });

  describe('incoming.body', () => {
    it('should match by schema using match', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.body',
        $match: { foo: { bar: 1 } },
      });

      expect(operator.match({ incoming: { body: { foo: { bar: 1 } } } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { foo: { bar: 2 } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: {} } })).toBeFalsy();
    });

    it('should match by schema using matchAnyOf', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'incoming.body',
        $matchAnyOf: [{ foo: { bar: 1 } }, { baz: 2 }],
      });

      expect(operator.match({ incoming: { body: { foo: { bar: 1 } } } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { baz: 2 } } })).toBeTruthy();

      expect(operator.match({ incoming: { body: { foo: { bar: 2 } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: { baz: 1 } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: {} } })).toBeFalsy();
    });
  });

  describe('incoming.path', () => {
    it('should match by schema using value', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $value: '/foo/bar/baz',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema using valueAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $valueAnyOf: ['/foo', '/bar', '/foo/bar/baz'],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema using regExp', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $regExp: /^\/foo\/\w+\/baz$/,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema using regExpAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $regExpAnyOf: [/\./, /^\/foo\/\w+\/baz$/, /^foo$/],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should match by schema using match', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $match: '/foo/*/baz',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using match', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $match: '/foo/*/*/baz',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using matchAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $matchAnyOf: ['/foo/baz', '/bar/baz', '/foo/bar/*'],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using matchAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $matchAnyOf: [],
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using exec', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $exec: (payload) => payload.includes('/foo'),
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using exec', () => {
      const operator = new operators.$has(operators, {
        $location: 'path',
        $exec: (payload) => payload === '/foo',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });
  });

  describe('incoming.method', () => {
    it('should match by schema using value', () => {
      const operator = new operators.$has(operators, {
        $location: 'method',
        $value: 'POST',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });
  });

  describe('outgoing.status', () => {
    it('should match by schema using value', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $value: 200,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using value', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $value: 201,
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using valueAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $valueAnyOf: [404, 200],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using valueAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $valueAnyOf: [404, 201],
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using match', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $match: '2**',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using match', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $match: '2*1',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using matchAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $matchAnyOf: ['2*1', '200'],
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using matchAnyOf', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $matchAnyOf: ['2*1'],
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using exec', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: (payload) => payload === 200,
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using exec', () => {
      const operator = new operators.$has<any>(operators, {
        $location: 'outgoing.status',
        $exec: (payload) => payload === '200',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using exec as string', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: 'payload === 200',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });

    it('should not match by schema using exec as string', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: 'payload === 201',
      });

      expect(operator.match(buildExpectationContext())).toBeFalsy();
    });

    it('should match by schema using exec as string with utils', () => {
      const operator = new operators.$has(operators, {
        $location: 'outgoing.status',
        $exec: '_.isEqual(payload, 200)',
      });

      expect(operator.match(buildExpectationContext())).toBeTruthy();
    });
  });
});
