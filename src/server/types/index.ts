import type { HttpTransport, WsTransport } from '../transports';
import type { TMetricPoint } from '../services';
import type { Expectation } from '../../expectations';
import type { History } from '../models';

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

export interface IIoExchangeSchema {
  'expectation:added': Expectation<any>['TPlain'];
  'expectation:updated': Expectation<any>['TPlain'];

  'history:added': History['TPlain'];
  'history:updated': History['TPlain'];

  'metric:registred': {
    name: string;
    point: TMetricPoint;
  };
}
