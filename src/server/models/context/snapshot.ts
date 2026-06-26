import rfdc from 'rfdc';
import _ from 'lodash';

import type { Container, ContainersStorage } from '../containers';
import type { IServerContext } from '../../types';
import type { RequestMessage } from '../message';
import type {
  IRequestContextCacheConfiguration,
  IRequestContextIncoming,
  IRequestContextOutgoing,
  IRequestContextForwarded,
  IRequestContextError,
  IRequestContextOverrides,
} from './types';

const clone = rfdc();

export class RequestContextSnapshot<TContext extends IServerContext = any> {
  public TPlain!: Pick<RequestContextSnapshot<TContext>['provided'], 'flags' | 'overrides' | 'seed' | 'transport'> & {
    transport: TContext['transport'];
    messages: RequestMessage['TPlain'][];

    state: RequestContextSnapshot<TContext>['state'];
    cache: RequestContextSnapshot<TContext>['cache'];

    incoming: Omit<IRequestContextIncoming, 'raw' | 'stream'>;
    outgoing: Omit<IRequestContextOutgoing, 'raw' | 'stream'>;

    forwarded?: Omit<IRequestContextForwarded, 'incoming' | 'outgoing' | 'messages'> & {
      incoming: Omit<IRequestContextIncoming, 'raw' | 'stream'>;
      outgoing?: Omit<IRequestContextOutgoing, 'raw' | 'stream'>;

      messages?: RequestMessage['TPlain'][];
    };

    container?: Container['TPlain'];
    error?: RequestContextSnapshot<TContext>['error'];
  };

  public TCache!: {
    messages: RequestMessage['TCache'][];
    outgoing: Omit<IRequestContextOutgoing, 'raw' | 'stream'> & {
      raw?: {
        data?: string;
      };

      dataRaw?: string;
    };
  };

  public transport: TContext['transport'] = this.provided.transport;
  public flags: Partial<Record<TContext['flag'], boolean>> = this.provided.flags;

  public storage: ContainersStorage = this.provided.storage;

  public cache: IRequestContextCacheConfiguration = this.provided.cache ?? { isEnabled: false };
  public state: object = this.provided.state ?? {};

  public incoming: IRequestContextIncoming = this.provided.incoming;
  public outgoing: IRequestContextOutgoing = this.provided.outgoing;
  public messages: RequestMessage[] = this.provided.messages ?? [];

  /** Expectation schema overrides */
  public overrides?: IRequestContextOverrides = this.provided.overrides;

  public forwarded?: IRequestContextForwarded = this.provided.forwarded;
  public error?: IRequestContextError = this.provided.error;

  public container?: Container<any> = this.provided.container;
  public seed?: number = this.provided.seed;

  constructor(
    protected provided:
      & Pick<TContext, 'transport'>
      & Pick<RequestContextSnapshot<TContext>, 'incoming' | 'outgoing' | 'storage' | 'flags' | 'overrides'>
      & Partial<
        Pick<RequestContextSnapshot<TContext>, 'messages' | 'state' | 'seed' | 'container' | 'forwarded' | 'error' | 'cache'>
      >
  ) {}

  public assign<T extends Partial<RequestContextSnapshot<TContext>['provided']>>(payload: T) {
    return Object.assign(this, payload);
  }

  public pick<K extends keyof RequestContextSnapshot<TContext>['provided']>(
    keys: K[]
  ): Pick<RequestContextSnapshot<TContext>, K> {
    return _.pick(this, keys);
  }

  public omit<K extends keyof RequestContextSnapshot<TContext>['provided']>(
    keys: K[]
  ): Omit<RequestContextSnapshot<TContext>, K> {
    return <Omit<RequestContextSnapshot, K>>_.omit(this, keys);
  }

  public unset<K extends keyof RequestContextSnapshot<TContext>['provided']>(
    keys: K[]
  ): Omit<RequestContextSnapshot<TContext>, K> {
    keys.forEach((key) => _.unset(this, key));
    return this;
  }

  public clone(): RequestContextSnapshot<TContext> {
    return RequestContextSnapshot.build({
      ..._.omit(this, ['incoming', 'outgoing']),

      incoming: Object.assign(clone(_.omit(this.incoming, ['stream', 'raw'])), {
        stream: this.incoming.stream,
        raw: {
          data: this.incoming.raw.data?.subarray(),
        },
      }),

      outgoing: Object.assign(clone(_.omit(this.outgoing, ['stream', 'raw'])), {
        stream: this.outgoing.stream,
        raw: {
          data: this.outgoing.raw.data?.subarray(),
        },
      }),
    });
  }

  public toPlain(): RequestContextSnapshot<TContext>['TPlain'] {
    return {
      transport: this.transport,
      flags: this.flags,
      error: this.error,

      overrides: this.overrides,
      state: this.state,
      cache: this.cache,

      seed: this.seed,
      container: this.container?.toPlain(),

      messages: this.messages.map((message) => message.toPlain()),

      incoming: _.omit(this.incoming, ['stream', 'raw']),
      outgoing: _.omit(this.outgoing, ['stream', 'raw']),

      ...(this.forwarded && {
        forwarded: {
          schema: this.forwarded.schema,
          incoming: _.omit(this.forwarded.incoming, ['raw']),

          ...(this.forwarded.outgoing && {
            outgoing: _.omit(this.forwarded.outgoing, ['raw']),
          }),

          messages: this.forwarded.messages?.map((message) => message.toPlain()),
        },
      }),
    };
  }

  public toCache(): RequestContextSnapshot<TContext>['TCache'] {
    const outoging: IRequestContextOutgoing = this.forwarded?.outgoing ?? {
      type: 'plain',
      status: 200,

      headers: {},
      raw: {},
    };

    return {
      messages: (this.forwarded?.messages ?? [])
        .filter((message) => message.direction === 'outgoing')
        .map((message) => message.toCache()),

      outgoing: Object.assign(_.omit(outoging, ['stream', 'raw']), {
        raw: {
          data: outoging.raw.data?.toString('base64'),
        },
      }),
    };
  }

  static build<TContext extends IServerContext>(
    configuration: RequestContextSnapshot<TContext>['provided']
  ): RequestContextSnapshot<TContext> {
    return new RequestContextSnapshot(configuration);
  }
}
