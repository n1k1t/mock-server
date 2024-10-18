import { cast } from '../../../utils';
import { IBaseRouteResponse } from './types';
import type { RequestContext } from '../../models/request-context';

const defaultHeaders = {
  'Content-type': 'Application/json',
};

export * from './types';

export class ReplyService<T> {
  constructor(public context: RequestContext<any, T>) {}

  public ok(payload: T) {
    const data = cast<IBaseRouteResponse<unknown>>({ status: 'OK', data: payload });

    if (this.context.isFlow('http')) {
      this.context.http.response.writeHead(200, defaultHeaders)
      this.context.http.response.write(JSON.stringify(data));
      this.context.http.response.end();
    }
    if (this.context.isFlow('ws')) {
      this.context.ws.callback(data);
    }
  }

  public internalError(message: string = 'Something went wrong') {
    const data = cast<IBaseRouteResponse<{ message: string }>>({ status: 'INTERNAL_ERROR', data: { message } });

    if (this.context.isFlow('http')) {
      this.context.http.response.writeHead(500, defaultHeaders)
      this.context.http.response.write(JSON.stringify(data));
      this.context.http.response.end();
    }
    if (this.context.isFlow('ws')) {
      this.context.ws.callback(data);
    }
  }

  public validationError(reasons: unknown[]) {
    const data = cast<IBaseRouteResponse<{ reasons: unknown[] }>>({ status: 'VALIDATION_ERROR', data: { reasons } });

    if (this.context.isFlow('http')) {
      this.context.http.response.writeHead(400, defaultHeaders)
      this.context.http.response.write(JSON.stringify(data));
      this.context.http.response.end();
    }
    if (this.context.isFlow('ws')) {
      this.context.ws.callback(data);
    }
  }

  public notFound() {
    const data = cast<IBaseRouteResponse<null>>({ status: 'NOT_FOUND', data: null });

    if (this.context.isFlow('http')) {
      this.context.http.response.writeHead(404, defaultHeaders)
      this.context.http.response.write(JSON.stringify(data));
      this.context.http.response.end();
    }
    if (this.context.isFlow('ws')) {
      this.context.ws.callback(data);
    }
  }

  static build<T>(context: RequestContext<any, T>) {
    return new ReplyService(context);
  }
}
