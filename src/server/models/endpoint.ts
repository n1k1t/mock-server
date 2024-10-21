import type { IHttpRequestIncommingContext, RequestContext } from './request-context';
import type { IBaseRouteResponse } from './reply-service';
import type { TRequestMethod } from '../../types';

export class Endpoint<T = unknown, U extends IHttpRequestIncommingContext = IHttpRequestIncommingContext> {
  public TResponse!: IBaseRouteResponse<T>;
  public TParameters!: U;

  public handler?: TFunction<unknown, [RequestContext<U, T>]>;

  public webSocket?: {
    path: string;
  };

  public http?: {
    method: TRequestMethod;
    path: string;
  };

  public bindToHttp<This extends NonNullable<Endpoint<T, U>['http']>>(http: This) {
    return Object.assign(this, { http });
  }

  public bindToWebSocket<Q extends NonNullable<Endpoint<T, U>['webSocket']>>(webSocket: Q) {
    return Object.assign(this, { webSocket });
  }

  public assignHandler<Q extends NonNullable<Endpoint<T, U>['handler']>>(handler: Q) {
    return Object.assign(this, { handler });
  }

  static build<T = unknown, U extends IHttpRequestIncommingContext = IHttpRequestIncommingContext>() {
    return new Endpoint<T, U>();
  }
}
