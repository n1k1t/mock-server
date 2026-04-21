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

/**
 * The router keeps multiple routes per pattern so independent providers can
 * share a URL prefix (for example several parallel test workers registering
 * their own provider under `/forward/**`). The HTTP listener iterates over
 * every matched route and the first provider whose expectation storage hits
 * wins; the rest are skipped without closing the response.
 */
export class Router<TContext extends IServerContext = IServerContext> extends Map<string, IRouteContext<TContext['transport']>[]> {
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

    const route: IRouteContext<TContext['transport']> = {
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
    };

    const existing = this.get(pattern);

    if (existing) {
      existing.push(route);
      return this;
    }

    return this.set(pattern, [route]);
  }

  /** Deletes each route that is using provider */
  public unregister(provider: Provider<any>): this {
    for (const [pattern, routes] of this.entries()) {
      const filtered = routes.filter((route) => route.provider.group !== provider.group);

      if (filtered.length === 0) {
        this.delete(pattern);
      } else if (filtered.length !== routes.length) {
        this.set(pattern, filtered);
      }
    }

    return this;
  }

  public *match<T extends Transport>(
    transport: TContext['transport'],
    path: string
  ): Generator<IRouteMatchResult<TContext['transport'], T>> {
    for (const [pattern, routes] of this.entries()) {
      if (minimatch(path, pattern)) {
        for (const route of routes) {
          yield {
            provider: route.provider,
            transport: <T>route.transports[transport],
          };
        }
      }
    }

    yield this.default(transport);
  }

  static build<TContext extends IServerContext = IServerContext>(server: MockServer<any, any>): Router<TContext> {
    return new Router<TContext>(server);
  }
}
