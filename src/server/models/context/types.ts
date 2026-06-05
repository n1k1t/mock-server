import type { IncomingHttpHeaders } from 'http';
import type { Observable } from 'rxjs';

import type { PartialDeep, SetRequiredKeys } from '../../../../types';
import type { IExpectationSchemaForward } from '../../../expectations';
import type { TRequestPayloadType } from '../../types';
import type { RequestMessage } from '../message';

export interface IRequestContextIncoming {
  type: TRequestPayloadType;

  path: string;
  method: string;

  headers: IncomingHttpHeaders;
  query: Record<string, any>;

  data?: unknown;
  dataRaw?: Buffer;

  stream?: Observable<RequestMessage>;

  delay?: number;
  error?: 'ECONNABORTED';
}

export interface IRequestContextOutgoing {
  type: TRequestPayloadType;

  headers: IncomingHttpHeaders;
  status: number;

  data?: unknown;
  dataRaw?: Buffer;

  stream?: Observable<RequestMessage>;
}

export interface IRequestContextError {
  code?: string;
  message?: string;
  isManual?: boolean;
}

export interface IRequestContextMessage {
  direction: 'incoming' | 'outgoing';

  timestamp: number;
  data: unknown;
}

export interface IRequestContextForwarded {
  schema: IExpectationSchemaForward;
  incoming: IRequestContextIncoming;

  outgoing?: IRequestContextOutgoing;
  messages?: IRequestContextMessage[];
}

export interface IRequestContextCache {
  outgoing: Omit<IRequestContextOutgoing, 'dataRaw'> & { dataRaw?: string };
  messages?: IRequestContextMessage[];
}

export interface IRequestContextCacheConfiguration {
  isEnabled: boolean;
  prefix?: string;
  key?: string | object;

  hasWritten?: boolean;
  hasRead?: boolean;

  /** Seconds */
  ttl?: number;
}

export interface IRequestContextOverrides {
  forward?: PartialDeep<Omit<IExpectationSchemaForward, 'cache'>>;
}

export type TRequestContextCacheConfigurationCompiled =
  | { isEnabled: false }
  | { isEnabled: boolean, key: string } & SetRequiredKeys<IRequestContextCacheConfiguration, 'ttl'>;
