import { compileContainerLink } from './utils';
import { Container } from './model';

export interface IContainerConfiguration<T extends object> {
  key: string | object;
  payload: T;

  /** Seconds */
  ttl?: number;
  prefix?: string;
}

export class ContainersStorage<T extends object = object> {
  private storage = new Map<string, Container<T>>();

  public register(configuration: IContainerConfiguration<T>): Container<T> {
    const key = compileContainerLink(configuration.key);
    const container = Container.build({
      key,
      payload: configuration.payload,

      timestamp: Date.now(),
      ttl: configuration?.ttl ?? 3600,

      hooks: {
        onUnbind: (target) => this.storage.delete(target.key),
        onBind: (key, target) => {
          const alias = Container.build({ ...target.provided, key });
          this.storage.set(alias.key, alias);
        },
      },
    });

    this.storage.set(container.key, container);
    return container;
  }

  public provide(configuration: IContainerConfiguration<T>): Container<T> {
    return this.find(configuration.key) ?? this.register(configuration);
  }

  public find(key: string | object): Container<T> | undefined {
    return <Container<T>>this.storage.get(compileContainerLink(key));
  }

  public delete(key: string | object): this {
    this.storage.delete(compileContainerLink(key));
    return this;
  }

  public getExpired(): Container[] {
    const timestamp = Date.now();
    return [...this.storage.values()].filter((container) => container.expiresAt < timestamp);
  }
}
