import type { IServerContextDefaults, MockServer } from '../../index';

import { ExpectationsStorage } from '../../../expectations';
import { ContainersStorage } from '../containers';
import { HistoryStorage } from '../history';
import { IServerContext } from '../../types';
import { OnsiteClient } from '../../../client';

export class Provider<TContext extends IServerContext = IServerContext> {
  public TContext!: TContext;
  public server!: MockServer;

  public client = OnsiteClient.build<TContext>(this);
  public group: string = this.provided.group;

  public storages = {
    expectations: new ExpectationsStorage(),
    containers: new ContainersStorage(),
    history: new HistoryStorage(this.provided),
  };

  constructor(protected provided: Pick<Provider, 'group'>) {}

  public assign(payload: Partial<Pick<Provider, 'server'>>): this {
    return Object.assign(this, payload);
  }

  static build<TContext extends IServerContext = IServerContextDefaults>(
    provided: Provider['provided']
  ): Provider<TContext> {
    return new Provider<TContext>(provided);
  }
}
