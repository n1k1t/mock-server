import type { Server } from 'socket.io';
import type { IWebSocketExchange } from './types';

export * from './types';

export const buildWebSocketExchange = (io: Pick<Server, 'emit'>): IWebSocketExchange => ({
  publish: (eventName: string, ...payload: unknown[]) => io.emit(eventName, ...payload),
});
