import { IncomingHttpHeaders } from 'http';

import type { SystemHttpRequestContext } from './context';

import { IRequestContextOutgoing, Reply } from '../../../models';
import { buildEndpointResponse } from '../utils';

const headers: IncomingHttpHeaders = {
  'content-type': 'application/json',
};

export class SystemHttpReply<TOutgoing = unknown> extends Reply<SystemHttpRequestContext, TOutgoing> {
  public ok(payload: TOutgoing) {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 200,

      raw: {
        data: Buffer.from(
          JSON.stringify(buildEndpointResponse('OK', payload))
        ),
      },
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers);
    this.context.response.write(outgoing.raw.data ?? Buffer.from(''));
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  public internalError(message: string = 'Something went wrong') {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 500,

      raw: {
        data: Buffer.from(
          JSON.stringify(buildEndpointResponse('INTERNAL_ERROR', { message }))
        ),
      },
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers)
    this.context.response.write(outgoing.raw.data ?? Buffer.from(''));
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  public validationError(reasons: unknown[] = ['Payload is not valid']) {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 400,

      raw: {
        data: Buffer.from(
          JSON.stringify(buildEndpointResponse('VALIDATION_ERROR', { reasons }))
        ),
      },
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers)
    this.context.response.write(outgoing.raw.data ?? Buffer.from(''));
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  public notFound() {
    const outgoing: IRequestContextOutgoing = {
      headers,

      type: 'plain',
      status: 404,

      raw: {
        data: Buffer.from(
          JSON.stringify(buildEndpointResponse('NOT_FOUND', null))
        ),
      },
    };

    this.context.response.writeHead(outgoing.status, outgoing.headers)
    this.context.response.write(outgoing.raw.data ?? Buffer.from(''));
    this.context.response.end();

    this.context.assign({ outgoing }).complete();
  }

  static build<TResponse>(context: SystemHttpRequestContext) {
    return new SystemHttpReply<TResponse>(context);
  }
}
