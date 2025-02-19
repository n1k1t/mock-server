import type { InternalHttpRequestContext } from './context';

import { IRequestContextOutgoing, Reply } from '../../../models';
import { buildEndpointResponse } from '../utils';

const headers = {
  'Content-type': 'application/json',
};

export class InternalHttpReply<TOutgoing = unknown> extends Reply<InternalHttpRequestContext, TOutgoing> {
  public ok(payload: TOutgoing) {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 200,

      dataRaw: Buffer.from(JSON.stringify(buildEndpointResponse('OK', payload))),
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

      dataRaw: Buffer.from(JSON.stringify(buildEndpointResponse('INTERNAL_ERROR', { message }))),
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers)
    this.context.response.write(outgoing.dataRaw);
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  public validationError(reasons: unknown[] = ['Payload is not valid']) {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 400,

      dataRaw: Buffer.from(JSON.stringify(buildEndpointResponse('VALIDATION_ERROR', { reasons }))),
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

      dataRaw: Buffer.from(JSON.stringify(buildEndpointResponse('NOT_FOUND', null))),
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
