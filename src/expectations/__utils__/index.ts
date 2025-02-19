import { IExpectationSchemaContext } from '../types';
import { ContainersStorage } from '../../server/models';

export const buildExpectationContext = (): IExpectationSchemaContext => ({
  storage: new ContainersStorage(),

  transport: 'http',
  event: 'connection',

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

    dataRaw: Buffer.from('{"foo": [{"bar": 1}, {"baz": ["2"]}]}'),
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
  },

  outgoing: {
    type: 'json',
    status: 200,

    dataRaw: Buffer.from('{"foo": {"bar": {"baz": true}}}'),
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
  },
});
