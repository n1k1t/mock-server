import type { MockServer } from '../../../index';
import type { TFunction } from '../../../../../types';

import { IRequestContextIncoming, RequestContext } from '../../../models';
import { SystemSocketIoReply } from './reply';

export class SystemSocketIoRequestContext<TOutgoing = unknown> extends RequestContext<{
  transport: 'io';
  flag: string & {};
}> {
  public incoming: IRequestContextIncoming = {
    type: 'json',
    data: this.request.data,

    path: this.request.path,
    method: 'NONE',

    headers: {},
    query: {},
    raw: {},
  };

  public reply = SystemSocketIoReply.build<TOutgoing>(this);
  public snapshot = this.compileSnapshot();

  constructor(
    public server: MockServer,
    public request: {
      path: string;
      data: unknown;
      callback?: TFunction<void>;
    }
  ) {
    super(server.providers.default, { transport: 'io' });
  }

  static build(server: MockServer, request: SystemSocketIoRequestContext['request']) {
    return new SystemSocketIoRequestContext(server, request);
  }
}
