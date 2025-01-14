import type { InternalSocketIoRequestContext } from './context';

import { IEndpointResponse, Reply } from '../../../models';
import { cast } from '../../../../utils';

export class InternalSocketIoReply<TOutgoing = unknown> extends Reply<InternalSocketIoRequestContext, TOutgoing> {
  public ok(payload: TOutgoing) {
    this.context.request.callback(cast<IEndpointResponse<unknown>>({ status: 'OK', data: payload }))
  }

  public internalError(message: string = 'Something went wrong') {
    this.context.request.callback(
      cast<IEndpointResponse<{ message: string }>>({ status: 'INTERNAL_ERROR', data: { message } })
    );
  }

  public validationError(reasons: unknown[]) {
    this.context.request.callback(
      cast<IEndpointResponse<{ reasons: unknown[] }>>({ status: 'VALIDATION_ERROR', data: { reasons } })
    );
  }

  public notFound() {
    this.context.request.callback(cast<IEndpointResponse<null>>({ status: 'NOT_FOUND', data: null }));
  }

  static build<TResponse>(context: InternalSocketIoRequestContext) {
    return new InternalSocketIoReply<TResponse>(context);
  }
}
