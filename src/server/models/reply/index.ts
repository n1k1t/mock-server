import type { HttpRequestContext, WsRequestContext } from '../request-context';

import { IBaseRouteResponse } from './types';
import { cast } from '../../../utils';

const defaultHeaders = {
  'Content-type': 'Application/json',
};

export * from './types';

export class Reply<TResponse = unknown> {
  constructor(public context: HttpRequestContext | WsRequestContext) {}

  public ok(payload: TResponse) {
    const data = cast<IBaseRouteResponse<unknown>>({ status: 'OK', data: payload });

    if (this.context.is('http')) {
      this.context.response.writeHead(200, defaultHeaders)
      this.context.response.write(JSON.stringify(data));
      this.context.response.end();
    }
    if (this.context.is('ws')) {
      this.context.request.callback(data);
    }
  }

  public internalError(message: string = 'Something went wrong') {
    const data = cast<IBaseRouteResponse<{ message: string }>>({ status: 'INTERNAL_ERROR', data: { message } });

    if (this.context.is('http')) {
      this.context.response.writeHead(500, defaultHeaders)
      this.context.response.write(JSON.stringify(data));
      this.context.response.end();
    }
    if (this.context.is('ws')) {
      this.context.request.callback(data);
    }
  }

  public validationError(reasons: unknown[]) {
    const data = cast<IBaseRouteResponse<{ reasons: unknown[] }>>({ status: 'VALIDATION_ERROR', data: { reasons } });

    if (this.context.is('http')) {
      this.context.response.writeHead(400, defaultHeaders)
      this.context.response.write(JSON.stringify(data));
      this.context.response.end();
    }
    if (this.context.is('ws')) {
      this.context.request.callback(data);
    }
  }

  public notFound() {
    const data = cast<IBaseRouteResponse<null>>({ status: 'NOT_FOUND', data: null });

    if (this.context.is('http')) {
      this.context.response.writeHead(404, defaultHeaders)
      this.context.response.write(JSON.stringify(data));
      this.context.response.end();
    }
    if (this.context.is('ws')) {
      this.context.request.callback(data);
    }
  }

  static build<TResponse>(context: HttpRequestContext | WsRequestContext) {
    return new Reply<TResponse>(context);
  }
}
