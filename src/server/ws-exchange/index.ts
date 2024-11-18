import type { Server } from 'socket.io';
import type { IWsExchangeService } from './types';

export * from './types';

export const buildWsExchange = (io: Pick<Server, 'emit'>): IWsExchangeService => ({
  publish: (eventName: string, ...payload: unknown[]) => io.emit(eventName, ...payload),
});
