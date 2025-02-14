import { RawData, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

import { extractHttpIncommingContext, IRequestContextIncoming, parsePayload, Provider, RequestContext } from '../../models';
import { IServerContext } from '../../types';
import { parseJsonSafe } from '../../../utils';
import { metaStorage } from '../../../meta';
import { Logger } from '../../../logger';

const logger = Logger.build('Server.Transports.Ws.Context');

export class WsRequestContext extends RequestContext<IServerContext<{
  transport: 'ws';
  event: 'connection' | 'message';
  flag: 'wsCloseConnection';
}>> {
  public snapshot = this.compileSnapshot();
  public history = this.compileHistory();

  constructor(
    public provider: Provider,
    public socket: WebSocket,
    public event: WsRequestContext['TContext']['event'],
    public incoming: IRequestContextIncoming
  ) {
    super(provider, { event, transport: 'ws' });

    metaStorage.wrap(this.meta, () => {
      event === 'message'
        ? logger.info(`Incoming WS ${event} [${incoming.path}] got message`, incoming.data)
        : logger.info(`Incoming WS ${event} [${incoming.path}]`);

      if (event === 'connection') {
        this.streams.incoming.subscribe({
          error: () => null,
          next: (data) => logger.info(`Incoming WS ${event} [${incoming.path}] got message`, data),
        });
      }

      this.streams.outgoing.subscribe({
        error: () => null,
        next: (data) => logger.info(`Incoming WS ${event} [${incoming.path}] has sent`, data),
      });
    });
  }

  public compileSnapshot() {
    const snapshot = super.compileSnapshot();

    snapshot.outgoing.status = this.event === 'message' ? 0 : 1000;
    snapshot.incoming.method = this.event === 'message' ? 'MSG' : 'CON';

    return snapshot;
  }

  public skip(): this {
    this.streams.incoming.complete();
    this.streams.outgoing.complete();

    return super.skip();
  }

  public complete() {
    logger.info(`Incoming WS ${this.event} [${this.incoming.path}] has finished in [${Date.now() - this.timestamp}ms]`);
    return super.complete();
  }

  static async build(
    provider: Provider,
    socket: WebSocket,
    request: IncomingMessage,
    event: WsRequestContext['TContext']['event'],
    message?: RawData
  ) {
    const incoming = await extractHttpIncommingContext(request);

    incoming.dataRaw = message?.toString();
    incoming.data = incoming.dataRaw
      ? incoming.type === 'plain'
        ? parseJsonSafe(incoming.dataRaw).result
        : parsePayload(incoming.type, incoming.dataRaw)
      : undefined;

    incoming.type = incoming.type === 'plain' && incoming.data !== undefined ? 'json' : incoming.type;

    return new WsRequestContext(provider, socket, event, incoming);
  }
}
