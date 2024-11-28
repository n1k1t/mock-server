import type { HttpRequestContext } from '../models';

export interface IHistoryRequest extends Pick<HttpRequestContext['TPlain'], 'incoming' | 'outgoing' | 'seed'> {
  error?: {
    code?: string;
    message?: string;
    isManual?: boolean;
  };
}

export interface IHistoryMeta {
  state: 'pending' | 'finished';
  requestedAt: number;
  updatedAt: number;
}
