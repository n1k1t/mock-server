import path from 'path';
import _ from 'lodash';

import type { SetRequiredKeys, TFunction } from '../../types';
import type { HttpRequestContext } from '../models';

import { Logger } from '../../logger';

export class Middleware<
  TRequired extends keyof HttpRequestContext['shared'] = never,
  TContext extends HttpRequestContext = HttpRequestContext & {
    shared: SetRequiredKeys<HttpRequestContext['shared'], TRequired>
  }
> {
  public TCompiled!: SetRequiredKeys<Middleware<TRequired, TContext>, 'handler'>;
  public handler?: TFunction<unknown, [TContext, { logger: Logger }]>;

  private logger = Logger.build(`Server.Middleware [${this.name}]`);

  constructor(public name: string, public required: TRequired[] = []) {}

  public assignHandler(handler: NonNullable<Middleware<TRequired, TContext>['handler']>) {
    return Object.assign(this, { handler });
  }

  public async exec<This extends this['TCompiled']>(this: This, context: TContext) {
    return this.handler(context, { logger: this.logger });
  }

  static build<TRequired extends keyof HttpRequestContext['shared'] = never>(name: string, required?: TRequired[]) {
    return new Middleware(path.parse(name).name.split('.')[0], required);
  }
}
