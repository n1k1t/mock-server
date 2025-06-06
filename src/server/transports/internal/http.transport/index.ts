import { IncomingMessage, ServerResponse } from 'http';

import type { MockServer } from '../../../index';

import { InternalHttpRequestContext } from './context';
import { InternalHttpExecutor } from './executor';
import { Provider, Transport } from '../../../models';

export * from './executor';
export * from './context';
export * from './reply';

export class InternalHttpTransport extends Transport<InternalHttpExecutor> {
  public executor = new InternalHttpExecutor();

  constructor(private server: MockServer) {
    super();
  }

  public compileContext(
    provider: Provider<InternalHttpTransport['TContext']>,
    request: IncomingMessage,
    response: ServerResponse
  ) {
    return InternalHttpRequestContext.build(this.server, request, response);
  }
}
