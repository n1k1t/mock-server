import _ from 'lodash';

import { ReplaySubject } from 'rxjs';
import { Value } from '@n1k1t/typebox/value';

import type { IRequestContextIncoming, IRequestContextOutgoing, TRequestContextCacheConfigurationCompiled } from './types';
import type { IServerContext } from '../../types';
import type { RequestMessage } from '../message';
import type { Expectation } from '../../../expectations';
import type { Provider } from '../providers';
import type { History } from '../history';

import { RequestContextSnapshot } from './snapshot';
import { metaStorage } from '../../../meta';
import { cast } from '../../../utils';

import config from '../../../config';

export * from './snapshot';
export * from './types';
export * from './utils';

export abstract class RequestContext<TContext extends IServerContext = any> {
  public TContext!: TContext;
  public TShared!: keyof Pick<RequestContext, 'incoming' | 'outgoing' | 'snapshot' | 'expectation' | 'history'>;

  public abstract incoming: IRequestContextIncoming;
  public abstract snapshot: RequestContextSnapshot<TContext>;

  public status = cast<'registered' | 'handling' | 'skipped' | 'completed' | 'canceled'>('registered');

  public streams = {
    incoming: new ReplaySubject<RequestMessage>(Infinity, 5000),
    outgoing: new ReplaySubject<RequestMessage>(Infinity, 5000),
  };

  public transport: TContext['transport'] = this.configuration.transport;
  public flags: Partial<Record<TContext['flag'], boolean>> = {};

  public expectation?: Expectation;
  public outgoing?: IRequestContextOutgoing;
  public history?: History;

  public timestamp = Date.now();
  public meta = metaStorage.generate();

  constructor(
    public provider: Provider,
    protected configuration: Pick<TContext, 'transport'>
  ) {}

  /** Switches to status */
  public switch(status: RequestContext['status']): this {
    return Object.assign(this, { status });
  }

  /** Checks context is in provided statuses */
  public is(statuses: RequestContext['status'][]): boolean {
    return statuses.includes(this.status);
  }

  /** Compiles snapshot of own payload to work with expectations */
  public compileSnapshot(): RequestContextSnapshot<TContext> {
    const snapshot = RequestContextSnapshot.build<IServerContext>({
      transport: this.transport,
      flags: this.flags,

      incoming: this.incoming,
      outgoing: this.outgoing ?? { type: this.incoming.type, status: 0, headers: {} },

      storage: this.provider.storages.containers,
      cache: { isEnabled: this.provider.server.databases.redis !== null },
    });

    snapshot.incoming.stream = this.streams.incoming.asObservable();
    snapshot.outgoing.stream = this.streams.outgoing.asObservable();

    return snapshot;
  };

  /** Compiles history model with own snapshot for GUI */
  public compileHistory(): History {
    return this.provider.storages.history.register({
      timestamp: this.timestamp,
      snapshot: this.compileSnapshot().clone(),
    });
  }

  /** Compiles cache configuration using own snapshot and expectation */
  public compileCacheConfiguration(): TRequestContextCacheConfigurationCompiled {
    if (!this.expectation?.schema.forward?.cache) {
      return { isEnabled: false };
    }

    const payload = this.snapshot.cache.key ?? _.pick(this.snapshot.incoming, ['path', 'method', 'data', 'query']);
    const prefix = this.snapshot.cache.prefix ?? this.expectation.schema.forward.cache.prefix;
    const key = typeof payload === 'object' ? Value.Hash(payload).toString() : String(payload);
    const ttl = this.snapshot.cache.ttl ?? this.expectation.schema.forward.cache.ttl ?? 3600;

    return { prefix, ttl, key: `${prefix ?? ''}${key}`, isEnabled: this.snapshot.cache.isEnabled };
  }

  /** Provides payload parts into context */
  public assign<T extends Partial<Pick<RequestContext<any>, RequestContext<any>['TShared']>>>(payload: T): this {
    return Object.assign(this, payload);
  }

  /** Marks context as skipped to prevent further handling in executors */
  public skip(): this {
    return this.switch('skipped');
  }

  /** Marks context as handling */
  public handle(): this {
    return this.switch('handling');
  }

  /** Marks context as canceled and unregisters history */
  public cancel(): this {
    this.provider.storages.history.unregister(this.history);
    return this.switch('canceled');
  }

  /** Marks context as completed, completes streams, provides outgoing payload from the own snapshot and publishes history */
  public complete(): this {
    if (this.is(['completed'])) {
      return this;
    }

    this.streams.incoming.complete();
    this.streams.outgoing.complete();

    if (!this.outgoing) {
      this.outgoing = this.snapshot.outgoing;
    }

    if (this.history?.is('pending')) {
      this.history.actualize(this.snapshot.assign({ outgoing: this.outgoing })).complete();

      const plain = this.history.toPlain();
      const configurations = {
        history: config.get('history'),
        containers: config.get('containers'),
      };

      if (this.provider.server.databases.redis) {
        if (configurations.history.persistence.isEnabled) {
          this.provider.server.databases.redis
            .multi()
            .lpush(configurations.history.persistence.key, JSON.stringify(plain))
            .ltrim(
              configurations.history.persistence.key,
              0,
              configurations.history.limit * this.provider.server.providers.extract().length
            )
            .exec();
        }

        if (configurations.containers.persistence.isEnabled && this.snapshot.container) {
          this.provider.server.databases.redis.setex(
            `${configurations.containers.persistence.key}:${this.provider.group}`,
            configurations.containers.persistence.ttl,
            JSON.stringify(this.provider.storages.containers.dump())
          );
        }
      }

      this.provider.server.exchanges.io.publish('history:updated', plain);
    }

    return this.switch('completed');
  }
}
