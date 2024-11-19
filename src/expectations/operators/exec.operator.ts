import _ from 'lodash';

import { IExpectationOperatorExecUtils, IExpectationOperatorContext } from '../types';
import { ExpectationOperator } from '../models/operator';

export default class ExecExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
> extends ExpectationOperator<TContext, string | TFunction<unknown, [IExpectationOperatorExecUtils<TContext>]>> {
  public compiled = this.compileExecHandler(this.command, ['utils']);

  public match(context: TContext): boolean {
    const result = this.compiled(context);
    return typeof result === 'boolean' ? result : true;
  }

  public manipulate<T extends TContext>(context: T): T {
    this.compiled(context);
    return context;
  }
}
