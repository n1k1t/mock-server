import { IncomingMessage, ServerResponse } from 'http';

import type { MockServer } from '../../../index';

import { SystemHttpRequestContext } from './context';
import { SystemHttpExecutor } from './executor';
import { Provider, Transport } from '../../../models';

export * from './executor';
export * from './context';
export * from './reply';

export class SystemHttpTransport extends Transport<SystemHttpExecutor> {
  public executor = new SystemHttpExecutor();

  constructor(protected server: MockServer) {
    super();
  }

  public compileContext(
    provider: Provider,
    request: IncomingMessage,
    response: ServerResponse
  ) {
    return SystemHttpRequestContext.build(this.server, request, response);
  }
}
