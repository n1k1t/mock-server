import path from 'path';
import _ from 'lodash';

import type { HttpRequestContext } from '../models';

export class Middleware<
  TRequired extends keyof HttpRequestContext['shared'] = never,
  TContext extends HttpRequestContext = HttpRequestContext & {
    shared: SetRequiredKeys<HttpRequestContext['shared'], TRequired>
  }
> {
  public TCompiled!: SetRequiredKeys<Middleware<TRequired, TContext>, 'handler'>;
  public handler?: TFunction<unknown, [TContext, (shared?: Partial<HttpRequestContext['shared']>) => unknown]>;

  constructor(public name: string, public required: TRequired[] = []) {}

  public assignHandler(handler: NonNullable<Middleware<TRequired, TContext>['handler']>) {
    return Object.assign(this, { handler });
  }

  public exec<This extends this['TCompiled']>(
    this: This,
    context: TContext,
    next: (result?: Partial<HttpRequestContext['shared']>) => unknown
  ) {
    return this.check(context).handler(context, next);
  }

  private check(context: HttpRequestContext) {
    const notExistentRequiredKeys = this.required?.filter((key) => !_.has(context.shared, key)) ?? [];
    if (notExistentRequiredKeys.length) {
      throw new Error(`Middleware "${this.name}" requires: ${notExistentRequiredKeys.join(', ')}`);
    }

    return this;
  }

  static build<TRequired extends keyof HttpRequestContext['shared'] = never>(name: string, required?: TRequired[]) {
    return new Middleware(path.parse(name).name, required);
  }
}
