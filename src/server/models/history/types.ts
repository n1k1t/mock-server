import type {
  IRequestContextCacheConfiguration,
  IRequestContextIncoming,
  IRequestContextOutgoing,
  RequestContextSnapshot,
} from '../context';

export type THistoryStatus = 'unregistered' | 'registered' | 'pending' | 'completed';

export interface IHistoryMeta {
  tags: Partial<Pick<RequestContextSnapshot, 'seed' | 'error'>> & {
    transport: RequestContextSnapshot['transport'];
    incoming: Partial<Pick<IRequestContextIncoming, 'path' | 'method'>>;

    outgoing?: Partial<Pick<IRequestContextOutgoing, 'status'>>;
    cache?: Partial<Pick<IRequestContextCacheConfiguration, 'hasRead' | 'hasWritten'>>;
  };

  metrics: {
    duration: number;
  };
}
