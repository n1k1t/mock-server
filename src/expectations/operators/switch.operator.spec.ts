import * as operators from './index';

describe('Expectations.Operators.Switch', () => {
  describe('matching', () => {
    it('should match by schema in incoming body using path', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $path: 'foo.bar',

        $cases: {
          'a': { $has: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          'b': { $has: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      expect(operator.match({ incoming: { data: {} } })).toBeTruthy();
      expect(operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'a' } } } })).toBeTruthy();
      expect(operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'b' } } } })).toBeTruthy();

      expect(operator.match({ incoming: { data: { foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'b' } } } })).toBeFalsy();
    });

    it('should match by schema in incoming body using exec', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload) => payload?.foo?.bar,

        $cases: {
          'a': { $has: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          'b': { $has: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      expect(operator.match({ incoming: { data: {} } })).toBeTruthy();
      expect(operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'a' } } } })).toBeTruthy();
      expect(operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'b' } } } })).toBeTruthy();

      expect(operator.match({ incoming: { data: { foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'b' } } } })).toBeFalsy();
    });

    it('should match by schema in incoming body using exec with utils', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload, { _ }) => _.get(payload, 'foo.bar'),

        $cases: {
          'a': { $has: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          'b': { $has: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      expect(operator.match({ incoming: { data: {} } })).toBeTruthy();
      expect(operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'a' } } } })).toBeTruthy();
      expect(operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'b' } } } })).toBeTruthy();

      expect(operator.match({ incoming: { data: { foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'a' } } } })).toBeFalsy();
      expect(operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'b' } } } })).toBeFalsy();
    });
  });

  describe('manipulation', () => {
    it('should manipulate by schema in incoming body using path', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $path: 'foo.bar',

        $cases: {
          'a': { $set: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          'b': { $set: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => context.default = true },
      });

      expect(operator.manipulate<any>({ incoming: { data: {} } }).default).toBeTruthy();

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'a' } } } }).incoming.data.baz
      ).toEqual('a');

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'b' } } } }).incoming.data.baz
      ).toEqual('b');

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'c' } } } }).incoming.data.baz
      ).toBeUndefined();
    });

    it('should match by schema in incoming body using exec', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload) => payload?.foo?.bar,

        $cases: {
          'a': { $set: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          'b': { $set: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => context.default = true },
      });

      expect(operator.manipulate<any>({ incoming: { data: {} } }).default).toBeTruthy();

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'a' } } } }).incoming.data.baz
      ).toEqual('a');

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'b' } } } }).incoming.data.baz
      ).toEqual('b');

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'c' } } } }).incoming.data.baz
      ).toBeUndefined();
    });

    it('should match by schema in incoming body using exec with utils', () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload, { _ }) => _.get(payload, 'foo.bar'),

        $cases: {
          'a': { $set: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          'b': { $set: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => context.default = true },
      });

      expect(operator.manipulate<any>({ incoming: { data: {} } }).default).toBeTruthy();

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'a' } } } }).incoming.data.baz
      ).toEqual('a');

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'b' } } } }).incoming.data.baz
      ).toEqual('b');

      expect(
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'c' } } } }).incoming.data.baz
      ).toBeUndefined();
    });
  })
});
