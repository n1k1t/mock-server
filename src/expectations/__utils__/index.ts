import { IRequestPlainContext, IResponsePlainContext } from '../../server/models';

export const buildExpectationContext = (): IRequestPlainContext & IResponsePlainContext => ({
  path: '/foo/bar/baz',
  method: 'POST',
  payloadType: 'json',

  statusCode: 200,

  dataRaw: '{"foo": {"bar": {"baz": true}}}',
  data: {
    foo: {
      bar: {
        baz: true,
      },
    },
  },

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
});
