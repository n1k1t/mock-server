
import type { Socket as ClientSocket } from 'socket.io-client';
import type { Socket as ServerSocket } from 'socket.io';
import type { Duplex, Stream } from 'stream';

import type { TFunction } from '../../types';

export type TSocketIoStreamFunction = (socket: ServerSocket | ClientSocket) => {
  emit: <T extends object = object>(event: string, stream: Stream, parameters: T) => void;

  on: <T extends object = object>(event: string, handler: TFunction<unknown, [Stream, T]>) => void;
  once: <T extends object = object>(event: string, handler: TFunction<unknown, [Stream, T]>) => void;
};

export type TSocketIoStreamPackage = TSocketIoStreamFunction & {
  createStream: (options?: { highWaterMark?: number }) => Duplex;
  createBlobReadStream: (file: File, options?: { highWaterMark?: number }) => Stream;
};

export const socketIoStream = <TSocketIoStreamPackage>require('socket.io-stream');
