
import type { IIoIncomingStream, IServerContext, MockServer } from '../../../index';

import { buildSocketIoExchange, Provider, Transport } from '../../../models';
import { InternalSocketIoRequestContext } from './context';
import { InternalSocketIoExecutor } from './executor';
import { cast, socketIoStream } from '../../../../utils';

export * from './executor';
export * from './context';
export * from './reply';

export class InternalSocketIoTransport extends Transport<InternalSocketIoExecutor> {
  public executor = new InternalSocketIoExecutor();

  constructor(protected server: MockServer) {
    super();

    server.io.on('connection', (socket) => {
      const stream = socketIoStream(socket);

      Object.values(this.executor.endpoints).forEach((endpoint) => {
        stream.on(endpoint.io.path, async (stream, parameters) =>
          endpoint.handler?.(
            await this.compileContext(server.providers.default, {
              path: endpoint.io.path,
              data: cast<IIoIncomingStream>({ stream, parameters }),
            })
          )
        );

        socket.on(endpoint.io.path, async (...args) =>
          endpoint.handler?.(
            await this.compileContext(server.providers.default, {
              path: endpoint.io.path,
              callback: args.pop(),
              data: args[0],
            })
          )
        );
      });
    });

    server.exchanges.io = buildSocketIoExchange(server.io);
  }

  public async compileContext(
    provider: Provider<IServerContext>,
    request: InternalSocketIoRequestContext['request']
  ) {
    return InternalSocketIoRequestContext.build(this.server, request);
  }
}
