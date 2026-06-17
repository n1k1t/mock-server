import { IContainerConfiguration } from './types';
import { compileContainerKey } from './utils';
import { Container } from './model';

export class ContainersStorage<TPayload extends object = object> {
  protected entities = new Map<string, Container<TPayload>>();
  protected aliases = new Map<string, Container<TPayload>>();

  constructor(protected configuration: { group: string }) {}

  public get size(): number {
    return this.entities.size;
  }

  public entries(): MapIterator<[string, Container<TPayload>]> {
    return this.entities.entries();
  }

  public values(): MapIterator<Container<TPayload>> {
    return this.entities.values();
  }

  public set(key: string, payload: Container<TPayload>): this {
    this.entities.set(key, payload);
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
        unbind: (key) => this.delete(key),
        bind: (key, target) => this.aliases.set(key, target),
      },
    });

    for (const alias of container.aliases.values()) {
      this.aliases.set(alias, container);
    }

    this.set(container.key, container);
    return container;
  }

  /** Finds or creates the container by provided configuration */
  public provide(configuration: IContainerConfiguration<TPayload>): Container<TPayload> {
    return this.find(configuration.key) ?? this.register(configuration);
  }

  public find(key: string | object): Container<TPayload> | undefined {
    const compiled = compileContainerKey(key);

    const entity = this.entities.get(compiled);
    if (entity) {
      return entity;
    }

    return this.aliases.get(compiled);
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
}
