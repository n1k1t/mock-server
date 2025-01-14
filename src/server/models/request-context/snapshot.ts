import rfdc from 'rfdc';
import _ from 'lodash';

import type { Container, ContainersStorage } from '../containers';
import type { IServerContext } from '../../types';
import type {
  IRequestContextCacheConfiguration,
  IRequestContextIncoming,
  IRequestContextOutgoing,
  IRequestContextMessage,
  IRequestContextForwarded,
} from './types';

const clone = rfdc();

export class RequestContextSnapshot<TContext extends IServerContext<any> = IServerContext<any>> {
  public TPlain!: Omit<RequestContextSnapshot['configuration'], 'container' | 'storage'> & {
    transport: TContext['transport'];

    container?: Container['TPlain'];
    error?: RequestContextSnapshot['error'];
  };

  public transport: TContext['transport'] = this.configuration.transport;
  public event: TContext['event'] = this.configuration.event;
  public flags: Partial<Record<TContext['flag'], boolean>> = this.configuration.flags;

  public storage: ContainersStorage = this.configuration.storage;

  public cache: IRequestContextCacheConfiguration = this.configuration.cache ?? { isEnabled: false };
  public state: object = this.configuration.state ?? {};

  public incoming: IRequestContextIncoming = this.configuration.incoming;
  public outgoing: IRequestContextOutgoing = this.configuration.outgoing;

  public forwarded?: IRequestContextForwarded = this.configuration.forwarded;
  public messages?: IRequestContextMessage[] = this.configuration.messages;

  public container?: Container<any> = this.configuration.container;
  public seed?: number = this.configuration.seed;

  public error?: {
    code?: string;
    message?: string;
    isManual?: boolean;
  };

  constructor(
    private configuration:
      & Pick<TContext, 'transport' | 'event'>
      & Pick<RequestContextSnapshot, 'incoming' | 'outgoing' | 'event' | 'storage' | 'flags'>
      & Partial<Pick<RequestContextSnapshot, 'messages' | 'state' | 'seed' | 'container' | 'forwarded' | 'error' | 'cache'>>
  ) {}

  public assign<T extends Partial<RequestContextSnapshot['configuration']>>(payload: T) {
    return Object.assign(this, payload);
  }

  public pick<K extends keyof RequestContextSnapshot['configuration']>(keys: K[]): Pick<RequestContextSnapshot, K> {
    return _.pick(this, keys);
  }

  public omit<K extends keyof RequestContextSnapshot['configuration']>(keys: K[]): Omit<RequestContextSnapshot, K> {
    return <Omit<RequestContextSnapshot, K>>_.omit(this, keys);
  }

  public unset<K extends keyof RequestContextSnapshot['configuration']>(keys: K[]): Omit<RequestContextSnapshot, K> {
    keys.forEach((key) => _.unset(this, key));
    return <Omit<RequestContextSnapshot, K>>this;
  }

  public clone(): this {
    return <this>RequestContextSnapshot.build({
      ..._.omit(this, ['incoming', 'outgoing']),

      incoming: Object.assign(clone(_.omit(this.incoming, ['stream'])), _.pick(this.incoming, ['stream'])),
      outgoing: Object.assign(clone(_.omit(this.outgoing, ['stream'])), _.pick(this.outgoing, ['stream'])),
    });
  }

  public toPlain(): RequestContextSnapshot['TPlain'] {
    return {
      transport: this.transport,
      event: this.event,
      flags: this.flags,

      state: this.state,
      cache: this.cache,

      seed: this.seed,
      container: this.container?.toPlain(),

      incoming: _.omit(this.incoming, ['stream']),
      outgoing: _.omit(this.outgoing, ['stream']),
      messages: this.messages,

      forwarded: this.forwarded,
      error: this.error,
    };
  }

  static build<TContext extends IServerContext<any>>(configuration: RequestContextSnapshot<TContext>['configuration']) {
    return new RequestContextSnapshot<TContext>(configuration);
  }
}
