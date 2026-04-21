import { IContainerConfiguration } from './types';
import { compileContainerLink } from './utils';
import { Container } from './model';

export class ContainersStorage<T extends object = object> {
  private nested = new Map<string, Container<T>>();

  public get size(): number {
    return this.nested.size;
  }

  public entries(): MapIterator<[string, Container<T>]> {
    return this.nested.entries();
  }

  public set(name: string, container: Container<T>): this {
    this.nested.set(name, container);
    return this;
  }

  /** Extends this storage with another */
  public extend(storage: ContainersStorage<T>): this {
    for (const [name, container] of storage.entries()) {
      this.set(name, container);
    }

    return this;
  }

  public register(configuration: IContainerConfiguration<T>): Container<T> {
    const key = compileContainerLink(configuration.key);
    const container = Container.build({
      key,
      payload: configuration.payload,

      timestamp: Date.now(),
      ttl: configuration?.ttl ?? 3600,

      hooks: {
        unbind: (target) => this.nested.delete(target.key),
        bind: (key, target) => {
          const alias = Container.build({ ...target.provided, key });
          this.nested.set(alias.key, alias);
        },
      },
    });

    this.nested.set(container.key, container);
    return container;
  }

  public provide(configuration: IContainerConfiguration<T>): Container<T> {
    return this.find(configuration.key) ?? this.register(configuration);
  }

  public find(key: string | object): Container<T> | undefined {
    return <Container<T>>this.nested.get(compileContainerLink(key));
  }

  public delete(key: string | object): this {
    this.nested.delete(compileContainerLink(key));
    return this;
  }

  public collectExpired(): Container[] {
    const timestamp = Date.now();
    return [...this.nested.values()].filter((container) => container.expiresAt < timestamp);
  }
}
