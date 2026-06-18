import { IContainerConfiguration } from './types';
import { compileContainerKey } from './utils';
import { Container } from './model';

export class ContainersStorage<TPayload extends object = object> {
  protected entities = new Map<string, Container>();
  protected aliases = new Map<string, Container>();

  constructor(protected configuration: { group: string }) {}

  public get size(): number {
    return this.entities.size;
  }

  public entries(): MapIterator<[string, Container]> {
    return this.entities.entries();
  }

  public values(): MapIterator<Container> {
    return this.entities.values();
  }

  /** Extends this storage with another */
  public extend(storage: ContainersStorage): this {
    for (const container of storage.values()) {
      this.register<object>(container);
    }

    return this;
  }

  public register<T extends object = TPayload>(
    predicate: Container<NoInfer<T>> | IContainerConfiguration<NoInfer<T>>
  ): Container<T> {
    const container = predicate instanceof Container ? predicate : Container.build({
      key: compileContainerKey(predicate.key),

      group: this.configuration.group,
      payload: predicate.payload,

      timestamp: Date.now(),
      ttl: predicate?.ttl ?? 3600,
    });

    container.configure({
      hooks: {
        unbind: (key) => this.delete(key),
        bind: (key, target) => this.aliases.set(key, target),
      },
    });

    for (const alias of container.aliases.values()) {
      this.aliases.set(alias, container);
    }

    this.entities.set(container.key, container);
    return container;
  }

  /** Finds or creates the container by provided configuration */
  public provide<T extends object = TPayload>(configuration: IContainerConfiguration<NoInfer<T>>): Container<T> {
    return this.find(configuration.key) ?? this.register(configuration);
  }

  public find<T extends object = TPayload>(key: string | object): Container<T> | undefined {
    const compiled = compileContainerKey(key);

    const entity = this.entities.get(compiled);
    if (entity) {
      return <Container<T>>entity;
    }

    return <Container<T>>this.aliases.get(compiled);
  }

  public delete(key: string | object): this {
    const compiled = compileContainerKey(key);
    const entity = this.entities.get(compiled);

    if (entity) {
      this.entities.delete(entity.key);
      entity.aliases.forEach((key) => this.aliases.delete(key));

      return this;
    }

    this.aliases.delete(compiled);
    return this;
  }

  /** Returns a list of expired containers */
  public expired(): Container[] {
    const timestamp = Date.now();
    return [...this.entities.values()].filter((container) => container.checkIsExpired(timestamp));
  }

  public clear(): this {
    this.entities.clear();
    this.aliases.clear();

    return this;
  }
}
