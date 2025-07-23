import type { IServerContext } from '../../../types';
import type { MockServer } from '../../../index';
import type { TFunction } from '../../../../../types';

import { IRequestContextIncoming, RequestContext } from '../../../models';
import { InternalSocketIoReply } from './reply';

export class InternalSocketIoRequestContext<TOutgoing = unknown> extends RequestContext<IServerContext<{
  transport: 'io';
  event: 'message';
}>> {
  public incoming: IRequestContextIncoming = {
    type: 'json',
    data: this.request.data,

    path: this.request.path,
    method: 'NONE',

    headers: {},
    query: {},
  };

  public reply = InternalSocketIoReply.build<TOutgoing>(this);
  public snapshot = this.compileSnapshot();

  constructor(
    public server: MockServer,
    public request: {
      path: string;
      data: unknown;
      callback?: TFunction<void>;
    }
  ) {
    super(server.providers.default, { transport: 'io', event: 'message' });
  }

  static build(server: MockServer, request: InternalSocketIoRequestContext['request']) {
    return new InternalSocketIoRequestContext(server, request);
  }
}
