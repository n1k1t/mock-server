import { RequestContext } from './model';
import { ServerContext } from '../server-context';
import { ReplyService } from '../reply-service';

export class WsRequestContext<TResponse = unknown> extends RequestContext<'ws'> {
  public reply: ReplyService<TResponse> = ReplyService.build<TResponse>(this);

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
