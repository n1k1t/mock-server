
import { WebSocket, RawData } from 'ws';
import { IncomingMessage } from 'http';

import { Provider, Router, Transport } from '../../models';
import { WsRequestContext } from './context';
import { metaStorage } from '../../../meta';
import { WsExecutor } from './executor';
import { Logger } from '../../../logger';

const logger = Logger.build('Server.Transports.Ws');

export const buildWsListener = (router: Router<WsRequestContext['TContext']>) =>
  async (socket: WebSocket, request: IncomingMessage) => {
    if (request.url?.startsWith('/socket.io')) {
      return socket.terminate();
    }

    const { provider, transport } = router.match<WsTransport>('ws', request.url ?? '');

    const context = await transport
      .compileContext(provider, socket, request, 'connection')
      .catch((error) => logger.error('Got error while [ws:connection] context compilation', error?.stack ?? error));

    if (!context) {
      return socket.close(1011);
    }

    const provided = await metaStorage
      .wrap(context.meta, () => transport.executor.exec(context))
      .catch((error) => logger.error('Get error while [ws:connection] execution', error?.stack ?? error));

    if (!provided) {
      return socket.close(1011);
    }

    if (socket.readyState === socket.OPEN) {
      socket.on('message', async (data) => {
        const context = await transport
          .compileContext(provider, socket, request, 'message', data)
          .catch((error) => logger.error('Got error while [ws:message] context compilation', error?.stack ?? error));

        if (!context) {
          return socket.close(1011);
        }

        metaStorage.wrap(context.meta, () => transport.executor.exec(context)).catch((error) => {
          logger.error('Get error while handling incoming request', error?.stack ?? error);
          socket.close(1011);
        });
      });
    }
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
