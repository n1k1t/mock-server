import type { Observable } from 'rxjs';

import type { TRequestPayloadType } from '../../types';
import type { SetRequiredKeys } from '../../../../types';

export interface IRequestContextIncoming {
  type: TRequestPayloadType;
  path: string;
  method: string;
  headers: Record<string, string>;

  query?: Record<string, unknown>;
  stream?: Observable<unknown>;

  data?: unknown;
  dataRaw?: Buffer;

  delay?: number;
  error?: 'ECONNABORTED';
}

export interface IRequestContextOutgoing {
  type: TRequestPayloadType;
  status: number;
  headers: Record<string, string>;

  data?: unknown;
  dataRaw?: Buffer;

  stream?: Observable<unknown>;
}

export interface IRequestContextError {
  code?: string;
  message?: string;
  isManual?: boolean;
}

export interface IRequestContextMessage {
  id: number;
  location: 'incoming' | 'outgoing';

  timestamp: number;
  data: unknown;
}

export interface IRequestContextForwarded {
  incoming: IRequestContextIncoming;
  outgoing?: IRequestContextOutgoing;

  messages?: Pick<IRequestContextMessage, 'location' | 'data'>[];
  isCached?: boolean;
}

export interface IRequestContextCache {
  outgoing: Omit<IRequestContextOutgoing, 'dataRaw'> & { dataRaw?: string };
  messages?: Pick<IRequestContextMessage, 'location' | 'data'>[];
}

export interface IRequestContextCacheConfiguration {
  isEnabled: boolean;
  prefix?: string;
  key?: string | object;

  /** Seconds */
  ttl?: number;
}

export type TRequestContextCacheConfigurationCompiled =
  | { isEnabled: false }
  | { isEnabled: true, key: string } & SetRequiredKeys<IRequestContextCacheConfiguration, 'ttl'>;
