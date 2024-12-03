import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IncomingMessage, ServerResponse } from 'http';

import type { SetRequiredKeys, TFunction, TRequestPayloadType } from '../../types';
import type { HttpRequestContext } from './request-context';

interface IPluginsStorage {
  'incoming.body': TFunction<Promise<{ raw: string, type?: TRequestPayloadType, payload?: object }>, [IncomingMessage]>;
  'outgoing.response': TFunction<unknown | Promise<unknown>, [
    ServerResponse,
    SetRequiredKeys<HttpRequestContext, 'outgoing'>
  ]>;

  'forward.response': TFunction<Promise<{ raw: string, type?: TRequestPayloadType, payload?: object }>, [
    AxiosResponse,
    HttpRequestContext
  ]>;

  'forward.request': TFunction<AxiosRequestConfig | Promise<AxiosRequestConfig>, [
    AxiosRequestConfig,
    HttpRequestContext
  ]>;
}

export class Plugins {
  private storage: IPluginsStorage = {
    'incoming.body': async (request) => {
      let raw = '';

      request.on('data', chunk => raw += chunk);
      await new Promise(resolve => request.on('end', resolve));

      return { raw };
    },

    'outgoing.response': (response, context) => {
      context.response.writeHead(context.outgoing.status ?? 200, context.outgoing.headers);
      context.response.write(context.outgoing.dataRaw);
      context.response.end();
    },

    'forward.request': (config) => config,
    'forward.response': async (response: AxiosResponse<Buffer>) => ({ raw: response.data.toString() }),
  }

  public exec<
    K extends keyof IPluginsStorage,
    T extends IPluginsStorage[K] extends TFunction<infer R0, infer R1> ? [R0, R1] : never,
  >(key: K, ...args: T[1]): T[0] {
    const handler = <TFunction>this.storage[key]
    return handler(...args);
  }

  public register<K extends keyof IPluginsStorage>(key: K, handler: IPluginsStorage[K]): this {
    this.storage[key] = handler;
    return this;
  }
}
