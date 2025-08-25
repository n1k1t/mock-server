import minimatch from 'minimatch';
import _ from 'lodash';

import type { IServerContext } from '../types';
import type { MockServer } from '../index';
import type { Transport } from './transports';
import type { Provider } from './providers';

export interface IRouteContext<TTransportType extends string> {
  transports: Partial<Record<TTransportType, Transport>>;
  provider: Provider<any>;
}

export interface IRouteMatchResult<
  K extends string,
  T extends Transport = Transport
> extends Pick<IRouteContext<K>, 'provider'> {
  transport: T;
}

export class Router<TContext extends IServerContext = IServerContext> extends Map<string, IRouteContext<TContext['transport']>> {
  constructor(protected server: MockServer<any, any>) {
    super();
  }

  public default<T extends Transport>(transport: TContext['transport']): IRouteMatchResult<TContext['transport'], T> {
    return {
      provider: this.server.providers.default,
      transport: <T>this.server.transports.get(transport),
    };
  }

  public register(
    pattern: string,
    configuration: {
      provider: Provider<any>;
      transports?: TContext['transport'][] | Partial<Record<TContext['transport'], Transport>>;
    }
  ): this {
    this.server.providers.register(configuration.provider);

    const types: TContext['transport'][] = Array.isArray(configuration.transports)
      ? configuration.transports
      : configuration.transports
        ? Object.keys(configuration.transports)
        : [...this.server.transports.keys()];

    return this.set(pattern, {
      provider: configuration.provider,

      transports: types.reduce<IRouteContext<TContext['transport']>['transports']>(
        (acc, type) => _.set(
          acc,
          type,
          Array.isArray(configuration.transports)
            ? this.server.transports.get(type)
            : configuration.transports?.[type] ?? this.server.transports.get(type)
        ),
        {}
      ),
    });
  }

  /** Deletes each route that is using provider */
  public unregister(provider: Provider): this {
    for (const [pattern, route] of this.entries()) {
      if (route.provider.group === provider.group) {
        this.delete(pattern);
      }
    }

    return this;
  }

  public *match<T extends Transport>(
    transport: TContext['transport'],
    path: string
  ): Generator<IRouteMatchResult<TContext['transport'], T>> {
    for (const [pattern, route] of this.entries()) {
      if (minimatch(path, pattern)) {
        yield {
          provider: route.provider,
          transport: <T>route.transports[transport],
        };
      }
    }

    yield this.default(transport);
  }

  static build<TContext extends IServerContext = IServerContext>(server: MockServer<any, any>): Router<TContext> {
    return new Router<TContext>(server);
  }
}
