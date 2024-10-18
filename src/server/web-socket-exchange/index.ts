import type { Server } from 'socket.io';
import { IWebSocketExchange } from './types';

export * from './types';

export const buildWebSocketExchange = (io: Server): IWebSocketExchange => ({
  publish: (eventName: string, ...payload: unknown[]) => io.emit(eventName, ...payload),
});
