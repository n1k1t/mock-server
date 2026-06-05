import type { ParsedUrlQueryInput } from 'querystring';
import type { ClientOptions } from 'ws';

export interface IWebSocketConfiguration extends ClientOptions {
  baseURL?: string;
  url?: string;

  signal?: AbortSignal;
  query?: ParsedUrlQueryInput;

  /** Milliseconds */
  timeout?: number;
}
