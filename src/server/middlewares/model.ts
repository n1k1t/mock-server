import path from 'path';
import _ from 'lodash';

import type { RequestContext } from '../models';

export type TMiddlewareHandler<K extends ExtractPartialKeys<RequestContext['shared']>> = TFunction<unknown, [
  SetRequiredKeys<RequestContext, 'http' | 'webSocketExchange'> & {
    shared: SetRequiredKeys<RequestContext['shared'], K>
  },
  (result?: Partial<RequestContext['shared']>) => unknown
]>;

export class Middleware {
  public required?: ExtractPartialKeys<RequestContext['shared']>[];
  public handler?: TFunction<unknown, [RequestContext, TFunction]>;

  constructor(public name: string) {}

  public requires<K extends ExtractPartialKeys<RequestContext['shared']>>(required: K[]) {
    return Object.assign(this, { required });
  }

  public assignHandler<
    This extends Middleware,
    K extends This['required'] extends string[] ? ConvertTupleToUnion<This['required']> : never
  >(this: This, handler: TMiddlewareHandler<K>) {
    return Object.assign(this, { handler });
  }

  public compile<This extends SetRequiredKeys<Middleware, 'handler'>>(this: This, context: RequestContext) {
    return {
      exec: <This['handler']>this.check(context).handler,
    }
  }

  private check(context: RequestContext) {
    const notExistentRequiredKeys = this.required?.filter((key) => !_.has(context.shared, key)) ?? [];
    if (notExistentRequiredKeys.length) {
      throw new Error(`Middleware "${this.name}" requires: ${notExistentRequiredKeys.join(', ')}`);
    }

    return this;
  }

  static build(name: string) {
    return new Middleware(path.parse(name).name);
  }
}
