import { io } from 'socket.io-client';

import type { IWsExchangeEventToPayloadMap } from '../../server/ws-exchange';
import type { PopupsComponent } from './components';
import type { TEndpoints } from '../../client';
import type { Config } from '../../config/model';

import { DynamicStorage } from './models';
import { cast } from '../../utils/common';

type ExtractWsEndpointPath<K extends keyof TEndpoints> = NonNullable<TEndpoints[K]['ws']> extends { path: infer R }
  ? R extends string ? R : never
  : never;

type TWsEndpoints = { [K in keyof TEndpoints as ExtractWsEndpointPath<K>]-?: TEndpoints[K] };

interface IContextShared {
  popups: PopupsComponent;
}

const ws = io(location.origin);

class Context {
  public config = cast<Pick<Config['storage'], 'gui' | 'history'>>({
    gui: {
      title: 'Mock server',
      route: 'about:blank',
    },

    history: {
      limit: 100,
    },
  });

  public instances = {
    ws,
  };

  public services = {
    ws: {
      exec: <K extends keyof TWsEndpoints & string>(
        path: K,
        body?: TWsEndpoints[K]['body']
      ): Promise<TWsEndpoints[K]['response']> => new Promise((resolve) => ws.emit(path, body, resolve)),

      subscribe: <
        K extends keyof IWsExchangeEventToPayloadMap,
        T extends IWsExchangeEventToPayloadMap[K]
      >(channel: K, handler: (payload: T) => unknown) => ws.on(<string>channel, handler)
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
