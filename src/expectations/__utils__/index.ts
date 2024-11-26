import { IExpectationOperatorContext } from '../types';
import { PartialDeep } from '../../types';

export const buildExpectationContext = (): PartialDeep<IExpectationOperatorContext> => ({
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

    bodyRaw: '{"foo": [{"bar": 1}, {"baz": ["2"]}]}',
    body: {
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

    dataRaw: '{"foo": {"bar": {"baz": true}}}',
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
