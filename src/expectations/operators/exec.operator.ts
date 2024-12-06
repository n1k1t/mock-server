import _ from 'lodash';

import { IExpectationOperatorExecUtils, IExpectationOperatorContext, TExpectationMetaTag } from '../types';
import { ExpectationOperator } from '../models/operator';
import { TFunction } from '../../types';

export default class ExecExpectationOperator<
  TContext extends IExpectationOperatorContext<any>,
> extends ExpectationOperator<TContext, string | TFunction<unknown, [IExpectationOperatorExecUtils<TContext>]>> {
  public compiled = this.compileExecHandler(this.command, ['utils']);

  public get tags(): TExpectationMetaTag[] {
    return [];
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
