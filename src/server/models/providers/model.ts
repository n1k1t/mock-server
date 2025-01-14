import { Redis } from 'ioredis';

import { IServerContext, TDefaultServerContext } from '../../types';
import { buildSocketIoExchange } from '../exchanges';
import { ExpectationsStorage } from '../../../expectations';
import { ContainersStorage } from '../containers';
import { HistoryStorage } from '../history';
import { OnsiteClient } from '../../../client';
import { cast } from '../../../utils';

export class Provider<TContext extends IServerContext<any> = TDefaultServerContext> {
  public TContext!: TContext;

  public client = OnsiteClient.build<TContext>(this);
  public group: string = this.configuration.group;

  public storages = {
    expectations: new ExpectationsStorage(),
    containers: new ContainersStorage(),
    history: new HistoryStorage(this.configuration),
  };

  public databases = {
    redis: cast<Redis | null>(null),
  };

  public exchanges = {
    io: buildSocketIoExchange({ emit: () => false }),
  };

  constructor(private configuration: Pick<Provider, 'group'>) {}

  public assign(payload: Partial<Pick<Provider, 'databases' | 'exchanges'>>) {
    return Object.assign(this, payload);
  }

  static build<TContext extends IServerContext<any> = TDefaultServerContext>(
    configuration: Provider['configuration']
  ) {
    return new Provider<TContext>(configuration);
  }
}
