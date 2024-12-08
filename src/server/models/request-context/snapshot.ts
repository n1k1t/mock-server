import _ from 'lodash';

import type { IRequestContextCache, IRequestContextIncoming, IRequestContextOutgoing } from './types';
import type { Container, ContainersStorage } from '../containers';
import type { HttpRequestContext } from './http';
import type { PartialDeep } from '../../../types';

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
  public cache: IRequestContextCache = this.provided.cache;
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
      & Partial<Pick<RequestContextSnapshot, 'outgoing'>>
      & Pick<RequestContextSnapshot, 'state' | 'seed' | 'container' | 'incoming' | 'forwarded' | 'storage' | 'error' | 'cache'>
  ) {}

  public assign(payload: Partial<RequestContextSnapshot['provided']>) {
    return Object.assign(this, payload);
  }

  public pick<K extends keyof RequestContextSnapshot['provided']>(keys: K[]): Pick<RequestContextSnapshot, K> {
    return _.pick(this, keys);
  }

  public omit<K extends keyof RequestContextSnapshot['provided']>(keys: K[]): Omit<RequestContextSnapshot, K> {
    return <Omit<RequestContextSnapshot, K>>_.omit(this, keys);
  }

  public unset<K extends keyof RequestContextSnapshot['provided']>(keys: K[]): Omit<RequestContextSnapshot, K> {
    keys.forEach((key) => _.unset(this, key));
    return this;
  }

  public toPlain(): RequestContextSnapshot['TPlain'] {
    return {
      state: this.state,
      cache: this.cache,

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
