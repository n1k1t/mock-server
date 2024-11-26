import type { ServerContext } from '../server-context';
import type { TFunction } from '../../../types';

import { RequestContext } from './model';
import { Reply } from '../reply';

export class WsRequestContext<TResponse = unknown> extends RequestContext<'ws'> {
  public reply: Reply<TResponse> = Reply.build<TResponse>(this);

  public incoming = {
    body: this.request.body,
    query: {},
  };

  constructor(
    public server: ServerContext,
    public request: {
      body: unknown;
      callback: TFunction<void>;
    }
  ) {
    super('ws', server);
  }

  static build(server: ServerContext, request: WsRequestContext['request']) {
    return new WsRequestContext(server, request);
  }
}
