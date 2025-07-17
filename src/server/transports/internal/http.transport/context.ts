import { IncomingMessage, ServerResponse } from 'http';
import _ from 'lodash';

import type { IServerContext } from '../../../types';
import type { MockServer } from '../../../index';

import { extractHttpIncommingContext, History, IRequestContextIncoming, RequestContext } from '../../../models';
import { InternalHttpReply } from './reply';
import { Logger } from '../../../../logger';

const logger = Logger.build('Server.Transports.Internal.Http.Context');

export class InternalHttpRequestContext<TOutgoing = unknown> extends RequestContext<IServerContext<{
  transport: 'http';
  event: 'connection';
}>> {
  public snapshot = this.compileSnapshot();
  public reply = InternalHttpReply.build<TOutgoing>(this);

  constructor(
    public server: MockServer,
    public incoming: IRequestContextIncoming,
    public request: IncomingMessage,
    public response: ServerResponse
  ) {
    super(server.providers.default, { transport: 'http', event: 'connection' });
    logger.info('Incoming request', `[${incoming.method} ${incoming.path}]`);
  }

  public complete() {
    logger.info(
      `Incoming request [${this.incoming.method} ${this.incoming.path}] has finished`,
      `with status [${this.outgoing?.status ?? 200}] in [${Date.now() - this.timestamp}ms]`
    );

    return super.complete();
  }

  public compileHistory(): History {
    return History.build({
      group: this.provider.group,
      snapshot: this.compileSnapshot(),
    });
  }

  static async build(server: MockServer, request: IncomingMessage, response: ServerResponse) {
    const incoming = await extractHttpIncommingContext(request);
    return new InternalHttpRequestContext(server, incoming, request, response);
  }
}
