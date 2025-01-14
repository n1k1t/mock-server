import type { HttpTransport, WsTransport } from '../transports';

export type TRequestPayloadType = 'json' | 'plain' | 'xml';
export type TDefaultServerContext = HttpTransport['TContext'] | WsTransport['TContext'];

export interface IServerContextInput {
  transport?: string;
  event?: string;
  flag?: string;
}

export interface IServerContext<TInput extends IServerContextInput = {}> {
  transport: Extract<TInput['transport'], string>;
  event: Extract<TInput['event'], string>;
  flag: Extract<TInput['flag'], string>;
}
