import type { SystemSocketIoRequestContext } from './context';

import { buildEndpointResponse } from '../utils';
import { Reply } from '../../../models';

export class SystemSocketIoReply<TOutgoing = unknown> extends Reply<SystemSocketIoRequestContext, TOutgoing> {
  public ok(payload: TOutgoing) {
    this.context.request.callback?.(buildEndpointResponse('OK', payload))
  }

  public internalError(message: string = 'Something went wrong') {
    this.context.request.callback?.(buildEndpointResponse('INTERNAL_ERROR', { message }));
  }

  public validationError(reasons: unknown[] = ['Payload is not valid']) {
    this.context.request.callback?.(buildEndpointResponse('VALIDATION_ERROR', { reasons }));
  }

  public notFound() {
    this.context.request.callback?.(buildEndpointResponse('NOT_FOUND', null));
  }

  static build<TResponse>(context: SystemSocketIoRequestContext) {
    return new SystemSocketIoReply<TResponse>(context);
  }
}
