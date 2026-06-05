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
  IRequestContextError,
  IRequestContextOverrides,
} from './types';

const clone = rfdc();

export class RequestContextSnapshot<TContext extends IServerContext = any> {
  public TPlain!: Omit<RequestContextSnapshot['configuration'], 'container' | 'storage' | 'forwarded' | 'state' | 'cache'> & {
    transport: TContext['transport'];

    state: RequestContextSnapshot['state'];
    cache: RequestContextSnapshot['cache'];

    incoming: {
      dataRaw?: string;
    };

    outgoing: {
      dataRaw?: string;
    };

    forwarded?: Omit<IRequestContextForwarded, 'incoming' | 'outgoing'> & {
      incoming: Omit<IRequestContextIncoming, 'dataRaw'> & {
        dataRaw?: string;
      };

      outgoing?: Omit<IRequestContextOutgoing, 'dataRaw'> & {
        dataRaw?: string;
      };
    };

    container?: Container['TPlain'];
    error?: RequestContextSnapshot['error'];
  };

  public transport: TContext['transport'] = this.configuration.transport;
  public flags: Partial<Record<TContext['flag'], boolean>> = this.configuration.flags;

  public storage: ContainersStorage = this.configuration.storage;

  public cache: IRequestContextCacheConfiguration = this.configuration.cache ?? { isEnabled: false };
  public state: object = this.configuration.state ?? {};

  public incoming: IRequestContextIncoming = this.configuration.incoming;
  public outgoing: IRequestContextOutgoing = this.configuration.outgoing;
  public messages: IRequestContextMessage[] = this.configuration.messages ?? [];

  /** Expectation schema overrides */
  public overrides?: IRequestContextOverrides = this.configuration.overrides;

  public forwarded?: IRequestContextForwarded = this.configuration.forwarded;
  public error?: IRequestContextError = this.configuration.error;

  public container?: Container<any> = this.configuration.container;
  public seed?: number = this.configuration.seed;

  constructor(
    protected configuration:
      & Pick<TContext, 'transport'>
      & Pick<RequestContextSnapshot, 'incoming' | 'outgoing' | 'storage' | 'flags' | 'overrides'>
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

      incoming: Object.assign(clone(_.omit(this.incoming, ['stream', 'dataRaw'])), {
        stream: this.incoming.stream,
        dataRaw: this.incoming.dataRaw?.subarray(),
      }),

      outgoing: Object.assign(clone(_.omit(this.outgoing, ['stream', 'dataRaw'])), {
        stream: this.outgoing.stream,
        dataRaw: this.outgoing.dataRaw?.subarray(),
      }),
    });
  }

  public toPlain(): RequestContextSnapshot['TPlain'] {
    return {
      transport: this.transport,
      flags: this.flags,

      overrides: this.overrides,
      state: this.state,
      cache: this.cache,

      seed: this.seed,
      container: this.container?.toPlain(),

      error: this.error,
      messages: this.messages,

      incoming: Object.assign(_.omit(this.incoming, ['stream']), {
        dataRaw: this.incoming.dataRaw?.toString(),
      }),

      outgoing: Object.assign(_.omit(this.outgoing, ['stream']), {
        dataRaw: this.outgoing.dataRaw?.toString(),
      }),

      ...(this.forwarded && {
        forwarded: {
          schema: this.forwarded.schema,

          incoming: Object.assign(_.omit(this.forwarded.incoming, ['dataRaw']), {
            dataRaw: this.forwarded.incoming.dataRaw?.toString(),
          }),

          ...(this.forwarded.outgoing && {
            outgoing: Object.assign(_.omit(this.forwarded.outgoing, ['dataRaw']), {
              dataRaw: this.forwarded.outgoing.dataRaw?.toString(),
            }),
          }),

          messages: this.forwarded.messages,
        },
      }),
    };
  }

  static build<TContext extends IServerContext>(
    configuration: RequestContextSnapshot<TContext>['configuration']
  ): RequestContextSnapshot<TContext> {
    return new RequestContextSnapshot<TContext>(configuration);
  }
}
