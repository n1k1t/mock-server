import { TRequestMethod, TRequestPayloadType } from '../../../types';

export type TRequestFlow = 'http' | 'ws';

export interface IHttpRequestIncommingContext {
  body?: object;
  query?: object;
  headers?: Record<string, string>;
}

export interface IRequestPlainContext<T extends IHttpRequestIncommingContext = IHttpRequestIncommingContext> {
  path: string;
  method: TRequestMethod;
  payloadType: TRequestPayloadType;

  body?: T['body'];
  bodyRaw: string;

  query: T['query'];
  headers: T['headers'];
}

export interface IResponsePlainContext extends Omit<
  IRequestPlainContext,
  'query' | 'body' | 'bodyRaw' | 'path' | 'method'
> {
  statusCode?: number;
  error?: Error;

  data?: object;
  dataRaw?: string;
}
