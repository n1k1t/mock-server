
import type { IIoIncomingStream, MockServer } from '../../../index';

import { buildSocketIoExchange, Provider, Transport } from '../../../models';
import { SystemSocketIoRequestContext } from './context';
import { SystemSocketIoExecutor } from './executor';
import { cast, socketIoStream } from '../../../../utils';

export * from './executor';
export * from './context';
export * from './reply';

export class SystemSocketIoTransport extends Transport<SystemSocketIoExecutor> {
  public executor = new SystemSocketIoExecutor();

  constructor(protected server: MockServer) {
    super();

    server.io.on('connection', (socket) => {
      const stream = socketIoStream(socket);

      Object.values(this.executor.endpoints).forEach((endpoint) => {
        stream.on(endpoint.locations.io.path, async (stream, parameters) =>
          endpoint.handler?.(
            await this.compileContext(server.providers.default, {
              path: endpoint.locations.io.path,
              data: cast<IIoIncomingStream>({ stream, parameters }),
            })
          )
        );

        socket.on(endpoint.locations.io.path, async (...args) =>
          endpoint.handler?.(
            await this.compileContext(server.providers.default, {
              path: endpoint.locations.io.path,
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
    provider: Provider,
    request: SystemSocketIoRequestContext['request']
  ) {
    return SystemSocketIoRequestContext.build(this.server, request);
  }
}
