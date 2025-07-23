import type { InternalSocketIoRequestContext } from './context';

import { buildEndpointResponse } from '../utils';
import { Reply } from '../../../models';

export class InternalSocketIoReply<TOutgoing = unknown> extends Reply<InternalSocketIoRequestContext, TOutgoing> {
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

  static build<TResponse>(context: InternalSocketIoRequestContext) {
    return new InternalSocketIoReply<TResponse>(context);
  }
}
