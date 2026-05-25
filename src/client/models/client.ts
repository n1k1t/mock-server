import type { Expectation, IExpectationSchemaContext, IExpectationSchemaInput } from '../../expectations';
import type { IExpectationHandlerContext } from './types';
import type { IServerContext } from '../../server';
import type { TMethodsSchema } from '../types';
import type { TFunction } from '../../../types';

import { compileExpectationOperators } from '../helpers';

export class Client<TContext extends IServerContext = any> {
  constructor(protected methods: TMethodsSchema) {}

  public get ping() {
    return this.methods.ping;
  }

  public get deleteExpectations() {
    return this.methods.expectationsDelete;
  }

  public createExpectation<TInput extends Partial<IExpectationSchemaInput>>(
    handler: TFunction<Expectation<IExpectationSchemaContext<TInput & TContext>>['configuration'], [
      IExpectationHandlerContext<IExpectationSchemaContext<TInput & TContext>>
    ]>
  ): ReturnType<TMethodsSchema['expectationsCreate']>;

  public createExpectation(
    configuration: Expectation['configuration']
  ): ReturnType<TMethodsSchema['expectationsCreate']>;

  public createExpectation(predicate: unknown): ReturnType<TMethodsSchema['expectationsCreate']> {
    return typeof predicate === 'function'
      ? this.methods.expectationsCreate(predicate(this.compileHandlerUtils()))
      : this.methods.expectationsCreate(<Expectation['configuration']>predicate);
  }

  public updateExpectation(
    configuration: { id: string, set: Partial<Expectation['configuration']> }
  ): ReturnType<TMethodsSchema['expectationsUpdate']>;

  public updateExpectation<TInput extends Partial<IExpectationSchemaInput>>(
    handler: TFunction<{ id: string, set: Partial<Expectation['configuration']> }, [
      IExpectationHandlerContext<IExpectationSchemaContext<TInput & TContext>>
    ]>
  ): ReturnType<TMethodsSchema['expectationsUpdate']>

  public updateExpectation(predicate: unknown): ReturnType<TMethodsSchema['expectationsUpdate']> {
    return typeof predicate === 'function'
      ? this.methods.expectationsUpdate(predicate(this.compileHandlerUtils()))
      : this.methods.expectationsUpdate(<{ id: string, set: Partial<Expectation['configuration']> }>predicate);
  }

  private compileHandlerUtils<TInput extends IExpectationSchemaInput>(): IExpectationHandlerContext<
    IExpectationSchemaContext<TInput & TContext>
  > {
    return {
      $: compileExpectationOperators(),
    }
  }
}
