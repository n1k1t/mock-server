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

  public async match(context: TContext): Promise<boolean> {
    const result = await this.compiled('match', context);
    return typeof result === 'boolean' ? result : true;
  }

  public async manipulate<T extends TContext>(context: T): Promise<T> {
    await this.compiled('manipulate', context);
    return context;
  }
}
