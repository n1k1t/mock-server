import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

import { Provider, Router, Transport } from '../../models';
import { WsRequestContext } from './context';
import { IServerContext } from '../../types';
import { metaStorage } from '../../../meta';
import { WsExecutor } from './executor';
import { Logger } from '../../../logger';

const logger = Logger.build('Transports.Ws');

export const buildWsListener = <T extends IServerContext>(router: Router<T>) =>
  async (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    if (request.url?.startsWith('/socket.io')) {
      return socket.destroy();
    }

    for (const match of router.match<WsTransport>('ws', request.url ?? '')) {
      const context = await match.transport
        .compileContext(match.provider, request, socket, head)
        .catch((error) => logger.error(`Got error while [ws] context compilation`, error?.stack ?? error));

      if (!context) {
        return socket.destroy();
      }
      if (!context.is(['registered', 'handling'])) {
        break;
      }

      const expectation = await metaStorage
        .wrap(context.meta, () => match.transport.executor.match(context))
        .catch((error) => logger.error(`Got error while [ws] expectation matching`, error?.stack ?? error));

      if (!context.is(['registered', 'handling'])) {
        break;
      }

      if (!expectation) {
        context.cancel();
        continue;
      }

      return metaStorage
        .wrap(context.meta, () => match.transport.executor.exec(context.handle(), { expectation }))
        .catch((error) => logger.error(`Got error while [ws] execution`, error?.stack ?? error));
    }

    const { transport, provider } = router.default<WsTransport>('ws');
    const context = await transport.compileContext(provider, request, socket, head);

    await metaStorage
      .wrap(context.meta, () => transport.executor.exec(context.handle()))
      .catch((error) => logger.error('Got error while execution', error?.stack ?? error));
  }

export class WsTransport extends Transport<WsExecutor> {
  public executor = new WsExecutor();

  public compileContext(
    provider: Provider,
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer
  ) {
    return WsRequestContext.build(provider, request, socket, head);
  }
}
