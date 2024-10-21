import type * as methods from './methods';
import type * as endpoints from '../server/endpoints';

export type TMethodsSchema = {
  [K in keyof typeof methods]: TFunction<Promise<typeof methods[K]['TResult']>, [typeof methods[K]['TBody']]>;
};

export interface IRemoteClientConnectOptions {
  host: string
  port: number
  timeout?: number
}

export type TEndpoints = {
  [K in keyof typeof endpoints]: {
    location: {
      url: (typeof endpoints)[K]['http']['path'];
      method: (typeof endpoints)[K]['http']['method'];
    };

    body: (typeof endpoints)[K]['TParameters']['body'];

    result: (typeof endpoints)[K]['TResponse']['data'];
    response: (typeof endpoints)[K]['TResponse'];
  };
}
