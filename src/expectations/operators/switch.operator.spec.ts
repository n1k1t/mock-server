import * as operators from './index';

describe('Expectations.Operators.Switch', () => {
  describe('matching', () => {
    it('should match by schema in incoming body using path', async () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $path: 'foo.bar',

        $cases: {
          a: { $has: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          b: { $has: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      const results = await Promise.all([
        operator.match({ incoming: { data: {} } }),
        operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'b' } } } }),
        operator.match({ incoming: { data: { foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'b' } } } }),
      ]);

      expect(results).toEqual([true, true, true, false, false, false]);
    });

    it('should match by schema in incoming body using exec', async () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload) => payload?.foo?.bar,

        $cases: {
          a: { $has: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          b: { $has: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      const results = await Promise.all([
        operator.match({ incoming: { data: {} } }),
        operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'b' } } } }),
        operator.match({ incoming: { data: { foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'b' } } } }),
      ]);

      expect(results).toEqual([true, true, true, false, false, false]);
    });

    it('should match by schema in incoming body using exec with utils', async () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload, { _ }) => _.get(payload, 'foo.bar'),

        $cases: {
          a: { $has: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          b: { $has: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: () => true },
      });

      const results = await Promise.all([
        operator.match({ incoming: { data: {} } }),
        operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'b' } } } }),
        operator.match({ incoming: { data: { foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'b', foo: { bar: 'a' } } } }),
        operator.match({ incoming: { data: { baz: 'a', foo: { bar: 'b' } } } }),
      ]);

      expect(results).toEqual([true, true, true, false, false, false]);
    });
  });

  describe('manipulation', () => {
    it('should manipulate by schema in incoming body using path', async () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $path: 'foo.bar',

        $cases: {
          a: { $set: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          b: { $set: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => (context.default = true) },
      });

      const results = await Promise.all([
        operator.manipulate<any>({ incoming: { data: {} } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'a' } } } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'b' } } } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'c' } } } }),
      ]);

      expect(results.map((r) => ({ default: r.default, baz: r.incoming.data.baz }))).toEqual([
        { default: true, baz: undefined },
        { default: undefined, baz: 'a' },
        { default: undefined, baz: 'b' },
        { default: true, baz: undefined },
      ]);
    });

    it('should match by schema in incoming body using exec', async () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload) => payload?.foo?.bar,

        $cases: {
          a: { $set: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          b: { $set: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => (context.default = true) },
      });

      const results = await Promise.all([
        operator.manipulate<any>({ incoming: { data: {} } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'a' } } } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'b' } } } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'c' } } } }),
      ]);

      expect(results.map((r) => ({ default: r.default, baz: r.incoming.data.baz }))).toEqual([
        { default: true, baz: undefined },
        { default: undefined, baz: 'a' },
        { default: undefined, baz: 'b' },
        { default: true, baz: undefined },
      ]);
    });

    it('should match by schema in incoming body using exec with utils', async () => {
      const operator = new operators.$switch<any>(operators, {
        $location: 'incoming.data',
        $exec: (payload, { _ }) => _.get(payload, 'foo.bar'),

        $cases: {
          a: { $set: { $location: 'incoming.data', $path: 'baz', $value: 'a' } },
          b: { $set: { $location: 'incoming.data', $path: 'baz', $value: 'b' } },
        },

        $default: { $exec: ({ context }) => (context.default = true) },
      });

      const results = await Promise.all([
        operator.manipulate<any>({ incoming: { data: {} } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'a' } } } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'b' } } } }),
        operator.manipulate<any>({ incoming: { data: { foo: { bar: 'c' } } } }),
      ]);

      expect(results.map((r) => ({ default: r.default, baz: r.incoming.data.baz }))).toEqual([
        { default: true, baz: undefined },
        { default: undefined, baz: 'a' },
        { default: undefined, baz: 'b' },
        { default: true, baz: undefined },
      ]);
    });
  });
});
