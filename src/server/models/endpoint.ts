import type { HttpRequestContext, IRequestContextIncoming, WsRequestContext } from './request-context';
import type { OmitPartial, TFunction } from '../../types';
import type { IBaseRouteResponse } from './reply';

export class Endpoint<
  TResponse = unknown,
  TRequest extends Partial<Pick<IRequestContextIncoming, 'body' | 'query'>> = {}
> {
  public TResponse!: IBaseRouteResponse<TResponse>;
  public TParameters!: {
    body: 'body' extends keyof TRequest ? TRequest['body'] : (void | undefined);
    query: 'query' extends keyof TRequest ? TRequest['query'] : (void | undefined);
  };

  public handler?: TFunction<unknown, [
    (HttpRequestContext<TResponse> | WsRequestContext<TResponse>) & {
      incoming: OmitPartial<Endpoint<TResponse, TRequest>['TParameters']>;
    }
  ]>;

  public ws?: {
    path: string;
  };

  public http?: {
    method: string;
    path: string;
  };

  public bindToHttp<This extends NonNullable<Endpoint<TResponse, TRequest>['http']>>(http: This) {
    return Object.assign(this, { http });
  }

  public bindToWs<Q extends NonNullable<Endpoint<TResponse, TRequest>['ws']>>(ws: Q) {
    return Object.assign(this, { ws });
  }

  public assignHandler<Q extends NonNullable<Endpoint<TResponse, TRequest>['handler']>>(handler: Q) {
    return Object.assign(this, { handler });
  }

  static build<
    TResponse = unknown,
    TRequest extends Partial<Pick<IRequestContextIncoming, 'body' | 'query'>> = {}
  >() {
    return new Endpoint<TResponse, TRequest>();
  }
}
