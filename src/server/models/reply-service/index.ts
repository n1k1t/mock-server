import { cast } from '../../../utils';
import { IBaseRouteResponse } from './types';
import type { HttpRequestContext, RequestContext, WsRequestContext } from '../../models/request-context';

const defaultHeaders = {
  'Content-type': 'Application/json',
};

export * from './types';

export class ReplyService<TResponse = unknown> {
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

  static build<T>(context: HttpRequestContext | WsRequestContext) {
    return new ReplyService(context);
  }
}
