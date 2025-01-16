import type { InternalHttpRequestContext } from './context';

import { IEndpointResponse, IRequestContextOutgoing, Reply } from '../../../models';
import { cast } from '../../../../utils';

const headers = {
  'Content-type': 'application/json',
};

export class InternalHttpReply<TOutgoing = unknown> extends Reply<InternalHttpRequestContext, TOutgoing> {
  public ok(payload: TOutgoing) {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 200,

      dataRaw: JSON.stringify(cast<IEndpointResponse<unknown>>({ status: 'OK', data: payload })),
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers);
    this.context.response.write(outgoing.dataRaw);
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  public internalError(message: string = 'Something went wrong') {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 500,

      dataRaw: JSON.stringify(
        cast<IEndpointResponse<{ message: string }>>({ status: 'INTERNAL_ERROR', data: { message } })
      ),
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers)
    this.context.response.write(outgoing.dataRaw);
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  public validationError(reasons: unknown[]) {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 400,

      dataRaw: JSON.stringify(
        cast<IEndpointResponse<{ reasons: unknown[] }>>({ status: 'VALIDATION_ERROR', data: { reasons } })
      ),
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers)
    this.context.response.write(outgoing.dataRaw);
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  public notFound() {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 404,

      dataRaw: JSON.stringify(cast<IEndpointResponse<null>>({ status: 'NOT_FOUND', data: null })),
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers)
    this.context.response.write(outgoing.dataRaw);
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  static build<TResponse>(context: InternalHttpRequestContext) {
    return new InternalHttpReply<TResponse>(context);
  }
}
