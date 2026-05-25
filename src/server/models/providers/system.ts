import { Container, ContainersStorage, IContainersStorageDump } from '../containers';
import { Expectation, ExpectationsStorage } from '../../../expectations';
import { History, HistoryStorage } from '../history';
import { RequestContextSnapshot } from '../context';
import { Provider } from './model';

export class SystemContainersStorage extends ContainersStorage<any> {
  /** Creates containers using provided dump */
  public restore(dump: IContainersStorageDump): this {
    dump.containers.forEach((container) => {
      const model = Container.build({
        key: container.key,
        group: container.group,

        payload: dump.payloads[container.payload],

        ttl: container.ttl,
        timestamp: Date.now(),
      });

      this.register(model);

      this.nested.delete(model.key);
      this.nested.set(`${container.group}:${container.key}`, model);
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

        ...(history.expectation && { expectation: Expectation.build(history.expectation) }),

        snapshot: RequestContextSnapshot.build({
          transport: history.snapshot.transport,
          event: history.snapshot.event,
          flags: history.snapshot.flags,

          cache: history.snapshot.cache,
          state: history.snapshot.state,
          error: history.snapshot.error,

          incoming: history.snapshot.incoming,
          outgoing: history.snapshot.outgoing,
          messages: history.snapshot.messages,

          seed: history.snapshot.seed,
          storage: fake.storages.containers,

          ...(history.snapshot.forwarded && {
            forwarded: {
              schema: history.snapshot.forwarded.schema,
              messages: history.snapshot.forwarded.messages,

              incoming: Object.assign(history.snapshot.forwarded.incoming, {
                dataRaw: history.snapshot.forwarded.incoming.dataRaw
                  ? Buffer.from(history.snapshot.forwarded.incoming.dataRaw)
                  : undefined,
              }),

              ...(history.snapshot.forwarded.outgoing && {
                outgoing: Object.assign(history.snapshot.forwarded.outgoing, {
                  dataRaw: history.snapshot.forwarded.outgoing.dataRaw
                    ? Buffer.from(history.snapshot.forwarded.outgoing.dataRaw)
                    : undefined,
                }),
              }),
            },
          }),
        })
      }))
    );

    return this;
  }
}

export class SystemProvider extends Provider {
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
