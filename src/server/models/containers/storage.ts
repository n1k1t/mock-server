import { compileContainerLink } from './utils';
import { Container } from './model';

export interface IContainerConfiguration<T extends object> {
  key: string | object;
  payload: T;

  /**
   * Seconds
  */
  ttl?: number;
  prefix?: string;
}

export class ContainersStorage<TPayload extends object = object> {
  private storage = new Map<string, Container>();

  public register<T extends TPayload>(configuration: IContainerConfiguration<T>): Container<T> {
    const link = compileContainerLink(configuration.key);
    const container = Container.build(link, configuration.payload, {
      timestamp: Date.now(),
      ttl: configuration?.ttl ?? 3600,

      hooks: {
        onUnbind: (target) => this.storage.delete(target.link),
        onBind: (key, target) => {
          const alias = Container.build(key, target.payload, target.configuration);
          this.storage.set(alias.link, alias);
        },
      },
    });

    this.storage.set(container.link, container);
    return container;
  }

  public provide<T extends TPayload>(configuration: IContainerConfiguration<T>): Container<T> {
    return this.find(configuration.key) ?? this.register(configuration);
  }

  public find<T extends TPayload>(key: string | object): Container<T> | undefined {
    return <Container<T>>this.storage.get(compileContainerLink(key));
  }

  public getExpired(): Container[] {
    const timestamp = Date.now();
    return [...this.storage.values()].filter((container) => container.expiresAt < timestamp);
  }

  public unlink(key: string | object): this {
    this.storage.delete(compileContainerLink(key));
    return this;
  }
}
