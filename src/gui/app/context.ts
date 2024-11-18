import { io } from 'socket.io-client';

import type { IWsExchangeEventToPayloadMap } from '../../server/ws-exchange';
import type { TEndpoints } from '../../client';

type TWsEndpoints = {
  [K in keyof TEndpoints as (TEndpoints[K]['ws'] extends object ? TEndpoints[K]['ws']['path'] : never)]-?: TEndpoints[K];
};

const ws = io(location.origin);

export default {
  config: {
    historyRecordsLimit: 100,
  },

  instances: {
    ws,
  },

  services: {
    ws: {
      exec: <K extends keyof TWsEndpoints>(path: K, body?: TWsEndpoints[K]['body']): Promise<TWsEndpoints[K]['response']> =>
        new Promise((resolve) => ws.emit(path, body, resolve)),

      subscribe: <
        K extends keyof IWsExchangeEventToPayloadMap,
        T extends IWsExchangeEventToPayloadMap[K]
      >(channel: K, handler: (payload: T) => unknown) => ws.on(<string>channel, handler)
    },
  },

  elements: {
    mainContainer: document.querySelector('div.main-container')!,
    tabContainer: document.querySelector('div.tab-container')!,
    tabsPanel: document.querySelector('ul.tabs')!,
  },

  cache: {
    historyRecords: <Record<string, { createdAt: number, element: Element, id: string }>>{},
  },
}
