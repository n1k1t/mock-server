import type { Server } from 'socket.io';

export interface ISocketIoExchangeService<TSchema extends object> {
  publish: <K extends keyof TSchema & string>(
    channel: K,
    payload: TSchema[K]
  ) => unknown;
}

export const buildSocketIoExchange = <TSchema extends object>(
  io: Pick<Server, 'emit'>
): ISocketIoExchangeService<TSchema> => ({
  publish: (eventName: string, ...payload: unknown[]) => io.emit(eventName, ...payload),
});
