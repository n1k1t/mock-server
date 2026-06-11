import { IExpectationSchemaContext } from '../types';
import { ContainersStorage } from '../../server/models';

export const buildExpectationContext = (): IExpectationSchemaContext => ({
  storage: new ContainersStorage({ group: 'test' }),
  transport: 'http',

  state: {},
  flags: {},

  cache: {
    isEnabled: false,
  },

  incoming: {
    type: 'json',

    path: '/foo/bar/baz',
    method: 'POST',

    query: {
      foo: 1,
      bar: {
        baz: null,
      },
    },

    data: {
      foo: [
        { bar: 1 },
        { baz: ['2'] },
      ],
    },

    headers: {
      'content-type': 'application/json',
      'accept-language': 'en/gb',
    },

    raw: {
      data: Buffer.from('{"foo": [{"bar": 1}, {"baz": ["2"]}]}'),
    },
  },

  outgoing: {
    type: 'json',
    status: 200,

    data: {
      foo: {
        bar: {
          baz: true,
        },
      },
    },

    headers: {
      'content-type': 'application/json',
    },

    raw: {
      data: Buffer.from('{"foo": {"bar": {"baz": true}}}'),
    },
  },
});
