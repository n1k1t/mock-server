import { IncomingMessage, ServerResponse } from 'http';
import _ from 'lodash';

import { IServerContext } from '../../types';
import { metaStorage } from '../../../meta';
import { Logger } from '../../../logger';
import {
  extractHttpIncommingContext,
  IRequestContextIncoming,
  Provider,
  RequestContext,
  RequestContextSnapshot,
} from '../../models';

const logger = Logger.build('Server.Transports.Http.Context');

export class HttpRequestContext extends RequestContext<IServerContext<{
  transport: 'http';
  event: 'connection';
}>> {
  public snapshot = this.compileSnapshot();
  public history = this.compileHistory();

  public meta = metaStorage.generate({
    ...(this.incoming.headers['x-request-id'] && { requestId: String(this.incoming.headers['x-request-id']) }),
  });

  constructor(
    public provider: Provider,
    public incoming: IRequestContextIncoming,
    public request: IncomingMessage,
    public response: ServerResponse
  ) {
    super(provider, { transport: 'http', event: 'connection' });

    metaStorage.wrap(this.meta, () => {
      logger.info('Incoming HTTP request', `[${incoming.method} ${incoming.path}]`);
    });
  }

  public complete(): this {
    logger.info(
      `Incoming HTTP request [${this.incoming.method} ${this.incoming.path}] has finished`,
      `with status [${this.outgoing?.status ?? 200}] in [${Date.now() - this.timestamp}ms]`
    );

    return super.complete();
  }

  public compileSnapshot(): RequestContextSnapshot {
    const snapshot = super.compileSnapshot();

    snapshot.outgoing.status = 200;
    snapshot.incoming.headers = _.omit(snapshot.incoming.headers, ['transfer-encoding']);

    return snapshot.assign({
      ...(this.incoming.headers['x-use-mock-seed'] && {
        seed: Number(this.incoming.headers['x-use-mock-seed']),
      }),

      ...(this.incoming.headers['x-use-mock-state'] && {
        state: JSON.parse(Buffer.from(String(this.incoming.headers['x-use-mock-state']), 'base64').toString()),
      }),
    });
  };

  static async build(provider: Provider, request: IncomingMessage, response: ServerResponse) {
    const incoming = await extractHttpIncommingContext(request);
    return new HttpRequestContext(provider, incoming, request, response);
  }
}
