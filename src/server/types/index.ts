import type { HttpTransport, WsTransport } from '../transports';
import type { TMetricPoint } from '../services';
import type { Expectation } from '../../expectations';
import type { History } from '../models';

export type TRequestPayloadType = 'json' | 'plain' | 'xml';

export interface IServerContextInput {
  transport?: string;
  event?: string;
  flag?: string;
}

export interface IServerContext<TInput extends IServerContextInput = {}> {
  transport: TInput extends { transport: infer R } ? R : (string & {});
  event: TInput extends { event: infer R } ? R : (string & {});
  flag: TInput extends { flag: infer R } ? R : (string & {});
}

export interface IServerContextDefaults {
  transport: HttpTransport['TContext']['transport'] | WsTransport['TContext']['transport'];
  event: HttpTransport['TContext']['event'] | WsTransport['TContext']['event'];
  flag: HttpTransport['TContext']['flag'] | WsTransport['TContext']['flag'];
}

export interface IIoExchangeSchema {
  'expectation:added': Expectation<any>['TPlain'];
  'expectation:updated': Expectation<any>['TPlain'];

  'history:added': History['TPlain'];
  'history:updated': History['TPlain'];

  'metric:registered': {
    name: string;
    point: TMetricPoint;
  };
}
