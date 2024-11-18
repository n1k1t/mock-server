import type { AxiosInstance } from 'axios';

import type { ServerContext } from '../../server/models';
import { cast } from '../../utils';

type THandler<TContext, TResult, TBody> = (context: TContext) => (body: TBody) => Promise<TResult>;

export interface IClientMethodHandlers<TResult = void, TBody = void> {
  remote: THandler<AxiosInstance, TResult, TBody>;
  onsite: THandler<ServerContext, TResult, TBody>;
}

export class ClientMethod<TResult = void, TBody = void> {
  public TResult!: TResult;
  public TBody!: TBody;

  private handlers = cast<IClientMethodHandlers<TResult, TBody>>({
    remote: () => () => Promise.reject(new Error('Not implemented')),
    onsite: () => () => Promise.reject(new Error('Not implemented')),
  });

  public provide<K extends keyof IClientMethodHandlers>(
    type: K,
    handler: IClientMethodHandlers<TResult, TBody>[K]
  ) {
    this.handlers[type] = handler;
    return this;
  }

  public compile<K extends keyof IClientMethodHandlers>(
    type: K,
    context: Parameters<IClientMethodHandlers<TResult, TBody>[K]>[0]
  ) {
    const handler: THandler<any, TResult, TBody> = this.handlers[type];
    return handler(context);
  }

  static build<TResult = void, TBody = void>() {
    return new ClientMethod<TResult, TBody>();
  }
}
