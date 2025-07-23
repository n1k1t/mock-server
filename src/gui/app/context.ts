import EventEmitter from 'events';
import axios from 'axios';
import io from 'socket.io-client';

import type { IIoExchangeSchema } from '../../server';
import type { PopupsComponent } from './components';
import type { TEndpoints } from '../../client';
import type { TFunction } from '../../../types';

import { Context } from './models';

type ExtractWsEndpointPath<K extends keyof TEndpoints> = TEndpoints[K]['io'] extends { path: infer R }
  ? R extends string ? R : never
  : never;

type TWsEndpoints = { [K in keyof TEndpoints as ExtractWsEndpointPath<K>]-?: TEndpoints[K] };

interface IEvents {
  'group:register': [string];
}

class MainContext extends Context<{
  popups: PopupsComponent;
  groups: Set<string>;
}> {
  public config = {
    history: {
      limit: 100,
    },
  };

  public instances = {
    http: axios.create({
      baseURL: `${window.DEV?.http.host ?? location.pathname.split('/').slice(0, -3).join('/')}/_system`,
    }),

    io: io(window.DEV?.io.origin ?? location.origin, {
      path: window.DEV?.io.path ?? `${location.pathname.split('/').slice(0, -3).join('/')}/socket.io/`
    }),
  };

  public services = {
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

  private events = new EventEmitter();

  public on<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents[K]>) {
    this.events.on(event, handler);
    return this;
  }

  public once<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents[K]>) {
    this.events.once(event, handler);
    return this;
  }

  public emit<K extends keyof IEvents>(event: K, ...args: IEvents[K]) {
    this.events.emit(event, ...args);
    return this;
  }

  public assignConfig(config: MainContext['config']) {
    return Object.assign(this, { config });
  }
}

export default new MainContext();
