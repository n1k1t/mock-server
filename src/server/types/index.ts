import type { Stream } from 'stream';

import type { HttpTransport, WsTransport } from '../transports';
import type { TMetricPoint } from '../services';
import type { Expectation } from '../../expectations';
import type { History } from '../models';

export type TRequestPayloadType = 'json' | 'plain' | 'xml';

export interface IServerContext {
  transport: string;
  flag: string;
}

export interface IServerContextDefaults {
  transport: HttpTransport['TContext']['transport'] | WsTransport['TContext']['transport'];
  flag: HttpTransport['TContext']['flag'] | WsTransport['TContext']['flag'];
}

export interface IIoExchangeSchema {
  'expectation:added': Expectation['TPlain'];
  'expectation:updated': Expectation['TPlain'];

  'history:added': History['TPlain'];
  'history:updated': History['TPlain'];

  'metric:registered': {
    name: string;
    point: TMetricPoint;
  };
}

export interface IIoIncomingStream<TParameters extends object = object> {
  parameters: TParameters;
  stream: Stream;
}

export interface ICacheBackup {
  redis: [string, string][];
}
