import { buildExpectationContext } from '../__utils__';
import * as operators from './index';

describe('Expectations.Operators.Switch', () => {
  describe('matching', () => {
    it('should match by schema in incoming body using path', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.body',
        $path: 'foo.bar',

        $cases: {
          'a': { $has: { $location: 'incoming.body', $path: 'baz', $value: 'a' } },
          'b': { $has: { $location: 'incoming.body', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      expect(operator.match({ incoming: { body: {} } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { baz: 'a', foo: { bar: 'a' } } } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { baz: 'b', foo: { bar: 'b' } } } })).toBeTruthy();

      expect(operator.match({ incoming: { body: { foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: { baz: 'b', foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: { baz: 'a', foo: { bar: 'b' } } } })).toBeFalsy();
    });

    it('should match by schema in incoming body using exec', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.body',
        $exec: (payload) => payload?.foo?.bar,

        $cases: {
          'a': { $has: { $location: 'incoming.body', $path: 'baz', $value: 'a' } },
          'b': { $has: { $location: 'incoming.body', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      expect(operator.match({ incoming: { body: {} } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { baz: 'a', foo: { bar: 'a' } } } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { baz: 'b', foo: { bar: 'b' } } } })).toBeTruthy();

      expect(operator.match({ incoming: { body: { foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: { baz: 'b', foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: { baz: 'a', foo: { bar: 'b' } } } })).toBeFalsy();
    });

    it('should match by schema in incoming body using exec with utils', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.body',
        $exec: (payload, { _ }) => _.get(payload, 'foo.bar'),

        $cases: {
          'a': { $has: { $location: 'incoming.body', $path: 'baz', $value: 'a' } },
          'b': { $has: { $location: 'incoming.body', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      expect(operator.match({ incoming: { body: {} } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { baz: 'a', foo: { bar: 'a' } } } })).toBeTruthy();
      expect(operator.match({ incoming: { body: { baz: 'b', foo: { bar: 'b' } } } })).toBeTruthy();

      expect(operator.match({ incoming: { body: { foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: { baz: 'b', foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { body: { baz: 'a', foo: { bar: 'b' } } } })).toBeFalsy();
    });
  });

  describe('manipulation', () => {
    it('should manipulate by schema in incoming body using path', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.body',
        $path: 'foo.bar',

        $cases: {
          'a': { $set: { $location: 'incoming.body', $path: 'baz', $value: 'a' } },
          'b': { $set: { $location: 'incoming.body', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => context.default = true },
      });

      expect(operator.manipulate<any>({ incoming: { body: {} } }).default).toBeTruthy();

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'a' } } } }).incoming.body.baz
      ).toEqual('a');

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'b' } } } }).incoming.body.baz
      ).toEqual('b');

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'c' } } } }).incoming.body.baz
      ).toBeUndefined();
    });

    it('should match by schema in incoming body using exec', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.body',
        $exec: (payload) => payload?.foo?.bar,

        $cases: {
          'a': { $set: { $location: 'incoming.body', $path: 'baz', $value: 'a' } },
          'b': { $set: { $location: 'incoming.body', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => context.default = true },
      });

      expect(operator.manipulate<any>({ incoming: { body: {} } }).default).toBeTruthy();

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'a' } } } }).incoming.body.baz
      ).toEqual('a');

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'b' } } } }).incoming.body.baz
      ).toEqual('b');

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'c' } } } }).incoming.body.baz
      ).toBeUndefined();
    });

    it('should match by schema in incoming body using exec with utils', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.body',
        $exec: (payload, { _ }) => _.get(payload, 'foo.bar'),

        $cases: {
          'a': { $set: { $location: 'incoming.body', $path: 'baz', $value: 'a' } },
          'b': { $set: { $location: 'incoming.body', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => context.default = true },
      });

      expect(operator.manipulate<any>({ incoming: { body: {} } }).default).toBeTruthy();

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'a' } } } }).incoming.body.baz
      ).toEqual('a');

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'b' } } } }).incoming.body.baz
      ).toEqual('b');

      expect(
        operator.manipulate<any>({ incoming: { body: { foo: { bar: 'c' } } } }).incoming.body.baz
      ).toBeUndefined();
    });
  })
});
