import type { InternalHttpRequestContext } from './context';

import { IEndpointResponse, Reply } from '../../../models';
import { cast } from '../../../../utils';

const headers = {
  'Content-type': 'application/json',
};

export class InternalHttpReply<TOutgoing = unknown> extends Reply<InternalHttpRequestContext, TOutgoing> {
  public ok(payload: TOutgoing) {
    const raw = JSON.stringify(cast<IEndpointResponse<unknown>>({ status: 'OK', data: payload }));

    this.context.response.writeHead(200, headers);
    this.context.response.write(raw);
    this.context.response.end();
  }

  public internalError(message: string = 'Something went wrong') {
    const raw = JSON.stringify(
      cast<IEndpointResponse<{ message: string }>>({ status: 'INTERNAL_ERROR', data: { message } })
    );

    this.context.response.writeHead(500, headers)
    this.context.response.write(raw);
    this.context.response.end();
  }

  public validationError(reasons: unknown[]) {
    const raw = JSON.stringify(
      cast<IEndpointResponse<{ reasons: unknown[] }>>({ status: 'VALIDATION_ERROR', data: { reasons } })
    );

    this.context.response.writeHead(400, headers)
    this.context.response.write(raw);
    this.context.response.end();
  }

  public notFound() {
    const raw = JSON.stringify(cast<IEndpointResponse<null>>({ status: 'NOT_FOUND', data: null }));

    this.context.response.writeHead(404, headers)
    this.context.response.write(raw);
    this.context.response.end();
  }

  static build<TResponse>(context: InternalHttpRequestContext) {
    return new InternalHttpReply<TResponse>(context);
  }
}
