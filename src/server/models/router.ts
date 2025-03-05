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

export class Router<TContext extends IServerContext<any>> extends Map<string, IRouteContext<TContext['transport']>> {
  constructor(private server: MockServer) {
    super();
  }

  public get defaults() {
    return {
      provider: this.server.providers.default,
      transports: this.server.transports,
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

    const types = Array.isArray(configuration.transports)
      ? configuration.transports
      : configuration.transports
        ? <TContext['transport'][]>Object.keys(configuration.transports)
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

  public match<T extends Transport>(transport: TContext['transport'], path: string): IRouteMatchResult<TContext['transport'], T> {
    for (const [pattern, route] of this.entries()) {
      if (minimatch(path, pattern)) {
        return {
          provider: route.provider,
          transport: <T>route.transports[transport],
        };
      }
    }

    return {
      provider: this.defaults.provider,
      transport: <T>this.defaults.transports.get(transport),
    };
  }

  static build<TContext extends IServerContext<any>>(server: MockServer) {
    return new Router<TContext>(server);
  }
}
