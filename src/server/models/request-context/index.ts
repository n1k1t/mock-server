import { ReplaySubject } from 'rxjs';
import { Value } from '@n1k1t/typebox/value';
import _ from 'lodash';

import type { IRequestContextIncoming, IRequestContextOutgoing, TRequestContextCacheConfigurationCompiled } from './types';
import type { IServerContext } from '../../types';
import type { Expectation } from '../../../expectations';
import type { Provider } from '../providers';
import type { History } from '../history';

import { RequestContextSnapshot } from './snapshot';
import { metaStorage } from '../../../meta';
import { cast } from '../../../utils';

export * from './snapshot';
export * from './types';
export * from './utils';

export abstract class RequestContext<TContext extends IServerContext<any> = IServerContext<any>> {
  public TContext!: TContext;
  public TShared!: keyof Pick<RequestContext, 'incoming' | 'outgoing' | 'snapshot' | 'expectation' | 'history'>;

  public abstract incoming: IRequestContextIncoming;
  public abstract snapshot: RequestContextSnapshot<TContext>;

  public status = cast<'handling' | 'skipped' | 'completed'>('handling');

  public streams = {
    incoming: new ReplaySubject(Infinity, 5000),
    outgoing: new ReplaySubject(Infinity, 5000),
  };

  public transport: TContext['transport'] = this.configuration.transport;
  public event: TContext['event'] = this.configuration.event;
  public flags: Partial<Record<TContext['flag'], boolean>> = {};

  public expectation?: Expectation<any>;
  public outgoing?: IRequestContextOutgoing;
  public history?: History;

  public timestamp = Date.now();
  public meta = metaStorage.generate();

  constructor(public provider: Provider<IServerContext<any>>, private configuration: Pick<TContext, 'transport' | 'event'>) {
    this.streams.incoming.subscribe({ error: () => null, next: (data) => this.history?.pushMessage('incoming', data) });
    this.streams.outgoing.subscribe({ error: () => null, next: (data) => this.history?.pushMessage('outgoing', data) });
  }

  public switchStatus(status: RequestContext['status']): this {
    this.status = status;
    return this;
  }

  public hasStatus(status: RequestContext['status']): boolean {
    return this.status === status;
  }

  /**
   * Compiles snapshot of own payload to work with expectations
   */
  public compileSnapshot(): RequestContextSnapshot<TContext> {
    const snapshot = RequestContextSnapshot.build<IServerContext<any>>({
      transport: this.transport,
      event: this.event,
      flags: this.flags,

      incoming: this.incoming,
      outgoing: this.outgoing ?? { type: this.incoming.type, status: 0, headers: {} },

      storage: this.provider.storages.containers,
      cache: { isEnabled: this.provider.databases.redis !== null },
    });

    snapshot.incoming.stream = this.streams.incoming.asObservable();
    snapshot.outgoing.stream = this.streams.outgoing.asObservable();

    return snapshot;
  };

  /**
   * Compiles history model with own snapshot for GUI
   */
  public compileHistory(): History {
    return this.provider.storages.history.register({
      snapshot: this.compileSnapshot().assign({ messages: [] }).clone(),
    });
  }

  /**
   * Compiles cache configuration using own snapshot and expectation
   */
  public compileCacheConfiguration(): TRequestContextCacheConfigurationCompiled {
    if (!this.snapshot.cache.isEnabled || !this.expectation?.forward?.cache) {
      return { isEnabled: false };
    }

    const payload = this.snapshot.cache.key ?? _.pick(this.snapshot.incoming, ['path', 'method', 'data', 'query']);
    const prefix = this.snapshot.cache.prefix ?? this.expectation?.forward?.cache?.prefix;
    const key = typeof payload === 'object' ? Value.Hash(payload).toString() : String(payload);
    const ttl = this.snapshot.cache.ttl ?? this.expectation.forward.cache.ttl ?? 3600;

    return { prefix, ttl, key: `${prefix ?? ''}${key}`, isEnabled: true };
  }

  /**
   * Provides payload parts into context
   */
  public assign<T extends Partial<Pick<RequestContext<any>, RequestContext<any>['TShared']>>>(payload: T) {
    return Object.assign(this, payload);
  }

  /**
   * Marks context as skipped to prevent further handling in executors
   */
  public skip() {
    return this.switchStatus('skipped');
  }

  /**
   * Marks context as completed, completes streams, provides outgoing payload from the own snapshot and publishes history
   */
  public complete() {
    if (this.hasStatus('completed')) {
      return this;
    }

    this.streams.incoming.complete();
    this.streams.outgoing.complete();

    if (!this.outgoing) {
      this.outgoing = this.snapshot.outgoing;
    }

    if (this.history?.hasStatus('pending')) {
      this.history.actualizeSnapshot(this.snapshot.assign({ outgoing: this.outgoing })).complete();
      this.provider.exchanges.io.publish('history:updated', this.history.toPlain());
    }

    return this.switchStatus('completed');
  }
}
