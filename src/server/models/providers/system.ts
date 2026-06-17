import _ from 'lodash';

import { Expectation, ExpectationsStorage } from '../../../expectations';
import { Container, ContainersStorage } from '../containers';
import { History, HistoryStorage } from '../history';
import { RequestContextSnapshot } from '../context';
import { RequestMessage } from '../../models';
import { IServerContext } from '../../types';
import { Provider } from './model';

export class SystemContainersStorage extends ContainersStorage<any> {
  /** Creates containers using provided dump */
  public restore(containers: Container['TBackup'][]): this {
    containers.forEach((backup) => {
      const container = this.register(Container.build(backup));

      this.entities.delete(container.key);
      this.entities.set(`${backup.group}:${backup.key}`, container);
    });

    return this;
  }
}

export class SystemHistoryStorage extends HistoryStorage {
  /** Injects and registers history items from plain */
  public restore(list: History['TPlain'][]): this {
    const fake = Provider.build({ group: this.configuration.group });

    list.forEach((history) => this.register(
      History.build({
        id: history.id,

        group: history.group,
        status: history.status,

        timestamp: history.timestamp,
        meta: history.meta,

        ...(history.expectation && {
          expectation: Expectation.build(history.expectation)
        }),

        snapshot: RequestContextSnapshot.build({
          transport: history.snapshot.transport,
          flags: history.snapshot.flags,

          cache: history.snapshot.cache,
          state: history.snapshot.state,
          error: history.snapshot.error,

          incoming: Object.assign(history.snapshot.incoming, { raw: {} }),
          outgoing: Object.assign(history.snapshot.outgoing, { raw: {} }),

          messages: history.snapshot.messages.map((message) => RequestMessage.build(message)),

          seed: history.snapshot.seed,
          storage: fake.storages.containers,

          ...(history.snapshot.forwarded && {
            forwarded: {
              schema: history.snapshot.forwarded.schema,
              messages: history.snapshot.forwarded.messages?.map((message) => RequestMessage.build(message)),

              incoming: Object.assign(history.snapshot.forwarded.incoming, { raw: {} }),

              ...(history.snapshot.forwarded.outgoing && {
                outgoing: Object.assign(history.snapshot.forwarded.outgoing, { raw: {} }),
              }),
            },
          }),
        })
      }))
    );

    return this;
  }
}

export class SystemProvider<TContext extends IServerContext = any> extends Provider<TContext> {
  public storages = {
    expectations: new ExpectationsStorage({ group: this.group }),
    containers: new SystemContainersStorage({ group: this.group }),
    history: new SystemHistoryStorage({ group: this.group, limit: Infinity }),
  } satisfies Provider['storages'];

  /** Distributes persistent history and containers to target provider */
  public distribute(provider: Provider): void {
    for (const history of this.storages.history.values()) {
      if (history.group !== provider.group) {
        continue;
      }

      provider.storages.history.register(history);
      this.storages.history.delete(history.id);
    }

    for (const container of this.storages.containers.values()) {
      if (container.group !== provider.group) {
        continue;
      }

      provider.storages.containers.register(container);
      this.storages.containers.delete(container.key);
    }
  }

  static build(provided: Provider['provided']): SystemProvider {
    return new SystemProvider(provided);
  }
}
