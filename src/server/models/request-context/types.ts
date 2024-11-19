import { TRequestPayloadType } from '../../../types';

export type TRequestContextType = 'http' | 'ws';

export interface IRequestContextIncoming {
  type: TRequestPayloadType;

  path: string;
  method: string;
  headers: Record<string, string | string[]>;

  query?: Record<string, unknown>;

  body?: unknown;
  bodyRaw?: string;

  delay?: number;
  error?: 'ECONNABORTED';
}

export interface IRequestContextOutgoing {
  type: TRequestPayloadType;

  status: number;
  headers: Record<string, string | string[]>;

  data?: unknown;
  dataRaw?: string;
}
