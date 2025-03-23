import type { MockServer } from '../../index';

import { IServerContext, TDefaultServerContext } from '../../types';
import { ExpectationsStorage } from '../../../expectations';
import { ContainersStorage } from '../containers';
import { HistoryStorage } from '../history';
import { OnsiteClient } from '../../../client';

export class Provider<TContext extends IServerContext<any> = TDefaultServerContext> {
  public TContext!: TContext;
  public server!: MockServer;

  public client = OnsiteClient.build<TContext>(this);
  public group: string = this.provided.group;

  public storages = {
    expectations: new ExpectationsStorage(),
    containers: new ContainersStorage(),
    history: new HistoryStorage(this.provided),
  };

  constructor(private provided: Pick<Provider, 'group'>) {}

  public assign(payload: Partial<Pick<Provider, 'server'>>): this {
    return Object.assign(this, payload);
  }

  static build<TContext extends IServerContext<any> = TDefaultServerContext>(
    provided: Provider['provided']
  ): Provider<TContext> {
    return new Provider<TContext>(provided);
  }
}
