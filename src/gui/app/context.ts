import { io as connectIo } from 'socket.io-client';

import type { ISocketIoExchangeEventToPayloadMap } from '../../server';
import type { PopupsComponent, SettingsComponent } from './components';
import type { TEndpoints } from '../../client';
import type { Config } from '../../config/model';

import type * as containers from './containers';

import { DynamicStorage } from './models';
import { cast } from '../../utils/common';

type ExtractWsEndpointPath<K extends keyof TEndpoints> = NonNullable<TEndpoints[K]['io']> extends { path: infer R }
  ? R extends string ? R : never
  : never;

type TWsEndpoints = { [K in keyof TEndpoints as ExtractWsEndpointPath<K>]-?: TEndpoints[K] };

interface IContextShared {
  containers: typeof containers;
  groups: Set<string>;

  popups: PopupsComponent;
  settings: SettingsComponent;
}

const io = connectIo(location.origin);

class Context {
  public config = cast<Pick<Config['storage'], 'history'>>({
    history: {
      limit: 100,
    },
  });

  public instances = {
    io,
  };

  public services = {
    io: {
      exec: <K extends keyof TWsEndpoints & string>(
        path: K,
        body?: TWsEndpoints[K]['incoming']['data']
      ): Promise<TWsEndpoints[K]['outgoing']> => new Promise((resolve) => io.emit(path, body, resolve)),

      subscribe: <
        K extends keyof ISocketIoExchangeEventToPayloadMap,
        T extends ISocketIoExchangeEventToPayloadMap[K]
      >(channel: K, handler: (payload: T) => unknown) => io.on(<string>channel, handler)
    },
  };

  public storage = DynamicStorage.build('void', document.body);
  public shared = <IContextShared>{};

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
