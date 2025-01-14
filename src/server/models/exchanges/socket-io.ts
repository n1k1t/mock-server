import type { Server } from 'socket.io';

import type { Expectation } from '../../../expectations';
import type { History } from '../history';

export interface ISocketIoExchangeEventToPayloadMap {
  'expectation:added': Expectation<any>['TPlain'];
  'expectation:updated': Expectation<any>['TPlain'];

  'history:added': History['TPlain'];
  'history:updated': History['TPlain'];
}

export interface ISocketIoExchangeService {
  publish: <K extends keyof ISocketIoExchangeEventToPayloadMap>(
    channel: K,
    payload: ISocketIoExchangeEventToPayloadMap[K]
  ) => unknown;
}

export const buildSocketIoExchange = (io: Pick<Server, 'emit'>): ISocketIoExchangeService => ({
  publish: (eventName: string, ...payload: unknown[]) => io.emit(eventName, ...payload),
});
