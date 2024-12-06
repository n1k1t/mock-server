import _ from 'lodash';

import type { IRequestContextIncoming, IRequestContextOptions, IRequestContextOutgoing } from './types';
import type { Container, ContainersStorage } from '../containers';
import type { HttpRequestContext } from './http';

const buildEmptyOutgoing = (incoming: IRequestContextIncoming): IRequestContextOutgoing => ({
  type: incoming.type,
  status: 200,

  data: incoming.type === 'plain' ? '' : {},
  dataRaw: '',

  headers: {
    'content-type': incoming.type === 'json'
      ? 'application/json'
      : incoming.type === 'xml'
      ? 'application/xml'
      : incoming.headers['content-type'] ?? 'text/plain',
  },
});

export class RequestContextSnapshot {
  public TPlain!: Omit<RequestContextSnapshot['provided'], 'container' | 'storage'> & {
    container?: Container['TPlain'];
    error?: RequestContextSnapshot['error'];
  }

  public storage: ContainersStorage<any> = this.provided.storage;

  public options: IRequestContextOptions = this.provided.options;
  public state: Record<string, any> = this.provided.state;

  public forwarded?: Pick<HttpRequestContext, 'incoming' | 'outgoing'> = this.provided.forwarded;

  public incoming: HttpRequestContext['incoming'] = this.provided.incoming;
  public outgoing: NonNullable<HttpRequestContext['outgoing']> = this.provided.outgoing ?? buildEmptyOutgoing(
    this.provided.incoming
  );

  public container?: Container<any> = this.provided.container;
  public seed?: number = this.provided.seed;

  public error?: {
    code?: string;
    message?: string;
    isManual?: boolean;
  };

  constructor(
    private provided:
      & Pick<RequestContextSnapshot, 'state' | 'seed' | 'options' | 'container' | 'incoming' | 'forwarded' | 'storage'>
      & Partial<Pick<RequestContextSnapshot, 'outgoing'>>
  ) {}

  public assign(payload: Partial<RequestContextSnapshot['provided'] & Pick<RequestContextSnapshot, 'error'>>) {
    return Object.assign(this, payload);
  }

  public toPlain(): RequestContextSnapshot['TPlain'] {
    return {
      options: this.options,
      state: this.state,

      seed: this.seed,
      container: this.container?.toPlain(),

      incoming: this.incoming,
      outgoing: this.outgoing,

      forwarded: this.forwarded,
      error: this.error,
    };
  }

  static build(provided: RequestContextSnapshot['provided']) {
    return new RequestContextSnapshot(provided);
  }
}
