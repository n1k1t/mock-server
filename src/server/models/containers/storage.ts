import { IContainerConfiguration, IContainersStorageDump } from './types';
import { compileContainerKey } from './utils';
import { Container } from './model';

export class ContainersStorage<TPayload extends object = object> {
  protected nested = new Map<string, Container<TPayload>>();

  constructor(protected configuration: { group: string }) {}

  public get size(): number {
    return this.nested.size;
  }

  public entries(): MapIterator<[string, Container<TPayload>]> {
    return this.nested.entries();
  }

  public values(): MapIterator<Container<TPayload>> {
    return this.nested.values();
  }

  public set(name: string, container: Container<TPayload>): this {
    this.nested.set(name, container);
    return this;
  }

  /** Extends this storage with another */
  public extend(storage: ContainersStorage<TPayload>): this {
    for (const [name, container] of storage.entries()) {
      this.set(name, container);
    }

    return this;
  }

  public register(predicate: Container<TPayload> | IContainerConfiguration<TPayload>): Container<TPayload> {
    const container = predicate instanceof Container ? predicate : Container.build({
      key: compileContainerKey(predicate.key),

      group: this.configuration.group,
      payload: predicate.payload,

      timestamp: Date.now(),
      ttl: predicate?.ttl ?? 3600,
    });

    container.configure({
      hooks: {
        unbind: (target) => this.delete(target.key),
        bind: (key, target) => this.register(
          Container.build({
            key,

            group: target.group,
            payload: target.payload,

            ttl: target.ttl,
            timestamp: Date.now(),
          })
        ),
      },
    });

    this.nested.set(container.key, container);
    return container;
  }

  /** Creates a dump of this storage */
  public dump(): IContainersStorageDump {
    const payloads: object[] = [];
    const containers: IContainersStorageDump['containers'] = [];

    this.nested.forEach((container) => {
      const index = payloads.indexOf(container.payload);
      if (index === -1) {
        payloads.push(container.payload);
      }

      containers.push({
        key: container.key,
        group: this.configuration.group,

        ttl: container.ttl,
        payload: index === -1 ? (payloads.length - 1) : index,
      });
    });

    return { payloads, containers };
  }

  /** Finds or creates the container by provided configuration */
  public provide(configuration: IContainerConfiguration<TPayload>): Container<TPayload> {
    return this.find(configuration.key) ?? this.register(configuration);
  }

  public find(key: string | object): Container<TPayload> | undefined {
    return <Container<TPayload>>this.nested.get(compileContainerKey(key));
  }

  public delete(key: string | object): this {
    this.nested.delete(compileContainerKey(key));
    return this;
  }

  /** Returns a list of expired containers */
  public collectExpired(): Container[] {
    const timestamp = Date.now();
    return [...this.nested.values()].filter((container) => container.expiresAt < timestamp);
  }
}
