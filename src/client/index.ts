import axios from 'axios';
import _ from 'lodash';

import { IClientConnectOptions } from './types';
import { handleRequestError } from './utils';
import { ConnectionError } from './errors';

import * as endpoints from '../server/endpoints';
import * as methods from './methods';

export * from './types';
export * from './errors';

type TMethodsSchema = {
  [K in keyof typeof methods]: (typeof methods)[K] extends TFunction<infer R, any[]> ? R : never;
};

export const connectClient = async ({ host, port, timeout }: IClientConnectOptions) => {
  const instance = axios.create({
    baseURL: `http://${host}:${port}`,
    timeout: timeout ?? 1000 * 10,
  });

  const pingResponse = await instance
    .request<typeof endpoints.ping['TResponse']>({
      url: endpoints.ping.http.path,
      method: endpoints.ping.http.method,
    })
    .catch(handleRequestError);

  if (pingResponse?.data.data !== 'pong') {
    throw new ConnectionError({ baseURL: instance.defaults.baseURL }, 'PING PONG');
  }

  console.log(`Client with PID [${process.pid}] has connected`);
  return Object.entries(methods).reduce((acc, [name, method]) => _.set(acc, name, method(instance)), <TMethodsSchema>{});
};
