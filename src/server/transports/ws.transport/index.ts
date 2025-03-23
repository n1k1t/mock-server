
import { WebSocket, RawData } from 'ws';
import { IncomingMessage } from 'http';

import { IRouteMatchResult, Provider, Router, Transport } from '../../models';
import { WsRequestContext } from './context';
import { metaStorage } from '../../../meta';
import { WsExecutor } from './executor';
import { Logger } from '../../../logger';

const logger = Logger.build('Server.Transports.Ws');

const signals = {
  close: Symbol('close'),
  break: Symbol('break'),
};

const handle = async (
  event: WsTransport['TContext']['event'],
  socket: WebSocket,
  request: IncomingMessage,
  match: IRouteMatchResult<'ws', WsTransport>,
  data?: RawData
): Promise<void | null | symbol> => {
  const context = await match.transport
    .compileContext(match.provider, socket, request, event, data)
    .catch((error) => logger.error(`Got error while [ws:${event}] context compilation`, error?.stack ?? error));

  if (!context) {
    return signals.close;
  }
  if (!context.hasStatus('handling')) {
    return signals.break;
  }

  const expectation = await metaStorage
    .wrap(context.meta, () => match.transport.executor.match(context))
    .catch((error) => logger.error(`Got error while [ws:${event}] expectation matching`, error?.stack ?? error));

  if (!context.hasStatus('handling')) {
    return signals.break;
  }
  if (!expectation) {
    return null;
  }

  await metaStorage
    .wrap(context.meta, () => match.transport.executor.exec(context, { expectation }))
    .catch((error) => logger.error(`Got error while [ws:${event}] execution`, error?.stack ?? error));

  return signals.close;
}

export const buildWsListener = (router: Router<WsRequestContext['TContext']>) =>
  async (socket: WebSocket, request: IncomingMessage) => {
    if (request.url?.startsWith('/socket.io')) {
      return socket.terminate();
    }

    const matches: IRouteMatchResult<'ws', WsTransport>[] = [];

    for (const match of router.match<WsTransport>('ws', request.url ?? '')) {
      matches.push(match);

      const signal = await handle('connection', socket, request, match);

      if (signal === signals.close) {
        return socket.close();
      }
      if (signal === signals.break) {
        break;
      }
    }

    if (!matches.length || socket.readyState !== socket.OPEN) {
      return socket.close();
    }

    socket.on('message', async (data) => {
      for (const match of matches) {
        const signal = await handle('message', socket, request, match, data);

        if (signal === signals.close) {
          return socket.close();
        }
        if (signal === signals.break) {
          break;
        }
      }
    });
  }

export class WsTransport extends Transport<WsExecutor> {
  public executor = new WsExecutor();

  public compileContext(
    provider: Provider,
    socket: WebSocket,
    request: IncomingMessage,
    event: WsExecutor['TContext']['event'],
    message?: RawData
  ) {
    return WsRequestContext.build(provider, socket, request, event, message);
  }
}
