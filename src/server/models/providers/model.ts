import type { IServerContextDefaults, MockServer } from '../../index';

import { ExpectationsStorage } from '../../../expectations';
import { ContainersStorage } from '../containers';
import { HistoryStorage } from '../history';
import { IServerContext } from '../../types';
import { OnsiteClient } from '../../../client';

export class Provider<TContext extends IServerContext = any> {
  public TContext!: TContext;
  public server!: MockServer;

  public timestamp: number = Date.now();

  public client = OnsiteClient.build<TContext>(this);
  public group: string = this.provided.group;

  /** Seconds */
  public ttl?: number = this.provided.ttl;
  public expiresAt: number = this.ttl ? this.timestamp + this.ttl * 1000 : Infinity;

  public storages = {
    expectations: new ExpectationsStorage({ group: this.group }),
    containers: new ContainersStorage({ group: this.group }),
    history: new HistoryStorage({ group: this.group, limit: this.provided.history?.limit }),
  };

  constructor(protected provided: Pick<Provider, 'group' | 'ttl'> & {
    history?: {
      limit?: number;
    };
  }) {}

  public assign(payload: Partial<Pick<Provider, 'server' | 'client' | 'storages'>>): this {
    return Object.assign(this, payload);
  }

  /** Extends storages of this instance with another provider */
  public extend(provider: Provider): this {
    this.storages.expectations.extend(provider.storages.expectations);
    this.storages.containers.extend(provider.storages.containers);
    this.storages.history.extend(provider.storages.history);

    return this;
  }

  static build<TContext extends IServerContext = IServerContextDefaults>(
    provided: Provider['provided']
  ): Provider<TContext> {
    return new Provider<TContext>(provided);
  }
}
