import minimatch from 'minimatch';
import _ from 'lodash';

import type { IServerContext } from '../types';
import type { MockServer } from '../index';
import type { Transport } from './transports';
import type { Provider } from './providers';

import { Logger } from '../../logger';

export interface IRouteContext<K extends string> {
  transports: Partial<Record<K, Transport>>;
  provider: Provider;
}

export interface IRouteMatchResult<T extends Transport = Transport> {
  transport: T;
  provider: Provider;
}

const logger = Logger.build('Router');

export class Router<TContext extends IServerContext = any> extends Map<string, Set<IRouteContext<TContext['transport']>>> {
  constructor(protected server: MockServer) {
    super();
  }

  public default<T extends Transport>(transport: TContext['transport']): IRouteMatchResult<T> {
    return {
      provider: this.server.providers.default,
      transport: <T>this.server.transports.get(transport),
    };
  }

  public register(
    pattern: string,
    configuration: {
      provider: Provider;
      transports?: TContext['transport'][] | Partial<Record<TContext['transport'], Transport>>;
    }
  ): this {
    const existent = this.get(pattern);
    const routes = existent ?? new Set<IRouteContext<TContext['transport']>>();

    const provided: TContext['transport'][] = Array.isArray(configuration.transports)
      ? configuration.transports
      : configuration.transports
        ? Object.keys(configuration.transports)
        : [...this.server.transports.keys()];

    const transports = provided.reduce<IRouteContext<TContext['transport']>['transports']>(
      (acc, type) => _.set(
        acc,
        type,
        Array.isArray(configuration.transports)
          ? this.server.transports.get(type)
          : configuration.transports?.[type] ?? this.server.transports.get(type)
      ),
      {}
    );

    for (const route of existent?.values() ?? []) {
      if (route.provider === configuration.provider) {
        logger.warn(`Route [${pattern}] is already registered with the same [${configuration.provider.group}] provider`);
        return this;
      }

      if (route.provider.group === configuration.provider.group) {
        logger.warn([
          `Route [${pattern}] is already registered with similar [${configuration.provider.group}] provider`,
          'Extending...',
        ].join('. '));

        route.provider.extend(configuration.provider);

        configuration.provider.assign({
          storages: route.provider.storages,
          client: route.provider.client,
          server: route.provider.server,
        });

        return this;
      }
    }

    this.server.providers.register(configuration.provider);
    routes.add({ transports, provider: configuration.provider });

    return this.set(pattern, routes);
  }

  /** Deletes each route that is using provider */
  public unregister(provider: Provider): this {
    for (const [pattern, routes] of this.entries()) {
      for (const route of routes) {
        if (route.provider.group === provider.group) {
          routes.delete(route);
        }
      }

      if (!routes.size) {
        this.delete(pattern);
      }
    }

    return this;
  }

  public *match<T extends Transport>(
    transport: TContext['transport'],
    path: string
  ): Generator<IRouteMatchResult<T>> {
    for (const [pattern, routes] of this.entries()) {
      if (minimatch(path, pattern)) {
        for (const route of routes) {
          if (!route.transports[transport]) {
            continue;
          }

          yield {
            provider: route.provider,
            transport: <T>route.transports[transport],
          };
        }
      }
    }

    yield this.default(transport);
  }

  static build<TContext extends IServerContext>(server: MockServer): Router<TContext> {
    return new Router<TContext>(server);
  }
}
