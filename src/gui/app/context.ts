import EventEmitter from 'events';
import io from 'socket.io-client';

import type { IIoExchangeSchema } from '../../server';
import type { PopupsComponent } from './components';
import type { TEndpoints } from '../../client';
import type { Config } from '../../config/model';

import { DynamicStorage } from './models';
import { TFunction } from '../../types';
import { cast } from '../../utils/common';

type ExtractWsEndpointPath<K extends keyof TEndpoints> = TEndpoints[K]['io'] extends { path: infer R }
  ? R extends string ? R : never
  : never;

type TWsEndpoints = { [K in keyof TEndpoints as ExtractWsEndpointPath<K>]-?: TEndpoints[K] };

interface IEvents {
  'group:register': [string];
}

interface IContextShared {
  popups: PopupsComponent;
  groups: Set<string>;
}

class Context {
  public config = cast<Pick<Config['storage'], 'history'>>({
    history: {
      limit: 100,
    },
  });

  public instances = {
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

  public storage = DynamicStorage.build('void', document.body);
  public shared = <IContextShared>{};

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

  public assignConfig(config: Context['config']) {
    return Object.assign(this, { config });
  }

  public share(shared: IContextShared) {
    return Object.assign(this, { shared });
  }

  public switchStorage(storage: DynamicStorage) {
    return Object.assign(this, { storage });
  }
}

export default new Context();
