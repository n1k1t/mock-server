
import type { Socket as ClientSocket } from 'socket.io-client';
import type { Socket as ServerSocket } from 'socket.io';
import type { Stream, Writable } from 'stream';

import type { TFunction } from '../../types';

export type TSocketIoStreamFunction = (socket: ServerSocket | ClientSocket) => {
  emit: <TParameters extends object = object>(event: string, stream: Stream, parameters: TParameters) => void;

  on: <TParameters extends object = object>(event: string, handler: TFunction<unknown, [Stream, TParameters]>) => void;
  once: <TParameters extends object = object>(event: string, handler: TFunction<unknown, [Stream, TParameters]>) => void;
};

export type TSocketIoStreamPackage = TSocketIoStreamFunction & {
  createStream: () => Writable;
  createBlobReadStream: (file: File) => Stream;
};

export const socketIoStream = <TSocketIoStreamPackage>require('socket.io-stream');
