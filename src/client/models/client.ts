import type { Expectation, IExpectationSchemaInput } from '../../expectations';
import type { IServerContext } from '../../server';
import type { TMethodsSchema } from '../types';
import type { TFunction } from '../../../types';

import { compileExpectationOperators } from '../helpers';
import {
  IExpectationHandlerContext,
  IExpectationSimplifiedConfiguration,
  IExpectationSimplifiedInput,
} from './types';

export class Client<TContext extends IServerContext = IServerContext> {
  constructor(protected methods: TMethodsSchema) {}

  public get ping() {
    return this.methods.ping;
  }

  public get deleteExpectations() {
    return this.methods.expectationsDelete;
  }

  public createExpectation<TInput extends IExpectationSchemaInput>(
    handler: TFunction<IExpectationSimplifiedConfiguration<TContext>, [IExpectationHandlerContext<TContext, TInput>]>
  ): ReturnType<TMethodsSchema['expectationsCreate']>;

  public createExpectation(
    configuration: Expectation<IExpectationSimplifiedInput<TContext>>['configuration']
  ): ReturnType<TMethodsSchema['expectationsCreate']>;

  public createExpectation(predicate: unknown): ReturnType<TMethodsSchema['expectationsCreate']> {
    return typeof predicate === 'function'
      ? this.methods.expectationsCreate(predicate(this.compileHandlerUtils()))
      : this.methods.expectationsCreate(<Expectation<IExpectationSimplifiedInput<TContext>>['configuration']>predicate);
  }

  public updateExpectation(
    configuration: { id: string, set: Partial<Expectation<IExpectationSimplifiedInput<TContext>>['configuration']> }
  ): ReturnType<TMethodsSchema['expectationsUpdate']>;

  public updateExpectation<TInput extends IExpectationSchemaInput>(
    handler: TFunction<{ id: string, set: Partial<IExpectationSimplifiedConfiguration<TContext>> }, [
      IExpectationHandlerContext<TContext, TInput>
    ]>
  ): ReturnType<TMethodsSchema['expectationsUpdate']>

  public updateExpectation(predicate: unknown): ReturnType<TMethodsSchema['expectationsUpdate']> {
    return typeof predicate === 'function'
      ? this.methods.expectationsUpdate(predicate(this.compileHandlerUtils()))
      : this.methods.expectationsUpdate(<{ id: string, set: Partial<IExpectationSimplifiedConfiguration<TContext>> }>predicate);
  }

  private compileHandlerUtils<TInput extends IExpectationSchemaInput>(): IExpectationHandlerContext<TContext, TInput> {
    return {
      $: compileExpectationOperators(),
      T: (payload: any) => payload,
    }
  }
}
