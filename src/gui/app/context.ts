import EventEmitter from 'events';
import io from 'socket.io-client';

import type { IIoExchangeSchema } from '../../server';
import type { PopupsComponent } from './components';
import type { TEndpoints } from '../../client';
import type { TFunction } from '../../../types';

import { Context } from './models';

import * as services from './services';

type ExtractWsEndpointPath<K extends keyof TEndpoints> = TEndpoints[K]['io'] extends { path: infer R }
  ? R extends string ? R : never
  : never;

type TWsEndpoints = { [K in keyof TEndpoints as ExtractWsEndpointPath<K>]-?: TEndpoints[K] };

class MainContext extends Context<{
  popups: PopupsComponent;
}> {
  public instances = {
    io: io(window.DEV?.io.origin ?? location.origin, {
      path: window.DEV?.io.path ?? `${location.pathname.split('/').slice(0, -3).join('/')}/socket.io/`
    }),
  };

  public services = {
    settings: services.SettingsService.build(),
    groups: services.GroupsService.build(),
    config: services.ConfigService.build(),

    io: {
      exec: <K extends keyof TWsEndpoints & string>(
        path: K,
        body?: TWsEndpoints[K]['incoming']['data']
      ): Promise<TWsEndpoints[K]['outgoing']> => new Promise((resolve) => this.instances.io.emit(path, body, resolve)),

      subscribe: <
        K extends keyof IIoExchangeSchema,
        T extends IIoExchangeSchema[K]
      >(channel: K, handler: (payload: T) => unknown) => this.instances.io.on(<string>channel, handler)
    },
  };
}

export default new MainContext();
