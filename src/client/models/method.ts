import type { AxiosInstance } from 'axios';

import type { SetPartialKeys, TFunction } from '../../types';
import type { Provider } from '../../server/models';

import { cast } from '../../utils';

type THandler<TContext, TSchema extends IClientMethodSchema> = TFunction<
  TFunction<Promise<TSchema['outgoing']>, [TSchema['incoming']]>,
  [TContext]
>;

export interface IClientMethodSchema {
  incoming?: unknown;
  outgoing?: unknown;
};

export interface IClientMethodHandlers<TSchema extends IClientMethodSchema> {
  remote: THandler<AxiosInstance, TSchema>;
  onsite: THandler<SetPartialKeys<Provider, 'server'>, TSchema>;
}

export class ClientMethod<TSchema extends IClientMethodSchema> {
  public TSchema!: TSchema;

  private handlers = cast<IClientMethodHandlers<TSchema>>({
    remote: () => () => Promise.reject(new Error('Not implemented')),
    onsite: () => () => Promise.reject(new Error('Not implemented')),
  });

  public register<K extends keyof IClientMethodHandlers<any>>(
    type: K,
    handler: IClientMethodHandlers<TSchema>[K]
  ) {
    this.handlers[type] = handler;
    return this;
  }

  public compile<K extends keyof IClientMethodHandlers<any>>(
    type: K,
    context: Parameters<IClientMethodHandlers<TSchema>[K]>[0]
  ) {
    const handler: THandler<any, any> = this.handlers[type];
    return handler(context);
  }

  static build<TSchema extends IClientMethodSchema>() {
    return new ClientMethod<TSchema>();
  }
}
