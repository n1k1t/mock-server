import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

import { cast, parseJsonSafe } from '../../../utils';
import { Logger } from '../../../logger';
import {
  extractHttpIncommingContext,
  IRequestContextIncoming,
  Provider,
  RequestContext,
  WebSocket,
} from '../../models';

const logger = Logger.build('Transports.Ws.Context');

export class WsRequestContext extends RequestContext<{
  transport: 'ws';
  flag: string & {};
}> {
  public snapshot = this.compileSnapshot();
  public history = this.compileHistory();

  public additional = {
    ws: cast<WebSocket | null>(null),
  };

  constructor(
    public provider: Provider,
    public incoming: IRequestContextIncoming,
    public request: IncomingMessage,
    public socket: Duplex,
    public head: Buffer,
  ) {
    super(provider, { transport: 'ws' });
  }

  public compileSnapshot() {
    const snapshot = super.compileSnapshot();
    const state = this.incoming.headers['x-use-mock-state']
      ? parseJsonSafe(Buffer.from(String(this.incoming.headers['x-use-mock-state']), 'base64').toString())
      : null;

    if (state?.status === 'ERROR') {
      logger.error('Got error while parsing [x-use-mock-state] header', state.error?.stack ?? state.error);
    }

    snapshot.incoming.method = 'WS';

    return snapshot.assign({
      ...(state?.status === 'OK' && {
        state: state.result,
      }),
    });
  }

  public handle(): this {
    logger.info(`Incoming WS connection [${this.incoming.path}]`);

    this.streams.incoming.subscribe({
        error: () => null,
        next: (message) =>
          logger.info(`Incoming WS connection [${this.incoming.path}] got message of [${message.dataRaw.length}] bytes`),
      });

    this.streams.outgoing.subscribe({
      error: () => null,
      next: (message) =>
        logger.info(`Incoming WS connection [${this.incoming.path}] sent message with [${message.dataRaw.length}] bytes`),
    });

    return super.handle();
  }

  public skip(): this {
    this.streams.incoming.complete();
    this.streams.outgoing.complete();

    return super.skip();
  }

  public complete() {
    logger.info(
      `Incoming WS connection [${this.incoming.path}] has finished`,
      `with status [${this.outgoing?.status ?? 0}] in [${Date.now() - this.timestamp}ms]`
    );

    return super.complete();
  }

  static async build(
    provider: Provider,
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer
  ): Promise<WsRequestContext> {
    const incoming = await extractHttpIncommingContext(request);
    return new WsRequestContext(provider, incoming, request, socket, head);
  }
}
