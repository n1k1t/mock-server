import _ from 'lodash';

import { IExpectationExecUtils, IExpectationMeta, IExpectationSchemaContext } from '../types';
import { ExpectationOperator } from '../models/operator';
import { TFunction } from '../../../types';

export default class ExecExpectationOperator<
  TContext extends IExpectationSchemaContext,
> extends ExpectationOperator<TContext, string | TFunction<unknown, [IExpectationExecUtils<TContext>]>> {
  public compiled = this.compileExecHandler(this.command, ['utils']);

  public get tags(): IExpectationMeta['tags'] {
    return {};
  }

  public match(context: TContext): boolean {
    const result = this.compiled('match', context);
    return typeof result === 'boolean' ? result : true;
  }

  public manipulate<T extends TContext>(context: T): T {
    this.compiled('manipulate', context);
    return context;
  }
}
