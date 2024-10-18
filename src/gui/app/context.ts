import { io } from 'socket.io-client';

import type { IWebSocketExchangeEventToPayloadMap } from '../../server/web-socket-exchange';
import type * as endpoints from '../../server/endpoints';

type TEnpoints = typeof endpoints;
type TWebSocketEndpoint = {
  [K in keyof TEnpoints]-?: TEnpoints[K]['webSocket'] extends object ? TEnpoints[K] : never;
}[keyof TEnpoints];

const webSocketInstance = io(location.origin);

export default {
  config: {
    historyRecordsLimit: 100,
  },

  instances: {
    ws: webSocketInstance,
  },

  webSocket: {
    exec: <
      K extends TWebSocketEndpoint['webSocket']['path'],
      T extends Extract<TWebSocketEndpoint, { webSocket: { path: K } }>
    >(path: K, parameters: T['TParameters']['body']): Promise<T['TResponse']> =>
      new Promise<T['TResponse']>((resolve) => webSocketInstance.emit(path, parameters, resolve)),

    subscribe: <
      K extends keyof IWebSocketExchangeEventToPayloadMap,
      T extends IWebSocketExchangeEventToPayloadMap[K]
    >(
      channel: K,
      handler: (payload: T) => unknown
    ) => webSocketInstance.on(<string>channel, handler)
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
