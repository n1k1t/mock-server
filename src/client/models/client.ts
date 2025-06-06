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
    return this.methods.deleteExpectations;
  }

  public createExpectation<TInput extends IExpectationSchemaInput>(
    handler: TFunction<IExpectationSimplifiedConfiguration<TContext>, [IExpectationHandlerContext<TContext, TInput>]>
  ): ReturnType<TMethodsSchema['createExpectation']>;

  public createExpectation(
    configuration: Expectation<IExpectationSimplifiedInput<TContext>>['configuration']
  ): ReturnType<TMethodsSchema['createExpectation']>;

  public createExpectation(predicate: unknown): ReturnType<TMethodsSchema['createExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.createExpectation(predicate(this.compileHandlerUtils()))
      : this.methods.createExpectation(<Expectation<IExpectationSimplifiedInput<TContext>>['configuration']>predicate);
  }

  public updateExpectation(
    configuration: { id: string, set: Partial<Expectation<IExpectationSimplifiedInput<TContext>>['configuration']> }
  ): ReturnType<TMethodsSchema['updateExpectation']>;

  public updateExpectation<TInput extends IExpectationSchemaInput>(
    handler: TFunction<{ id: string, set: Partial<IExpectationSimplifiedConfiguration<TContext>> }, [
      IExpectationHandlerContext<TContext, TInput>
    ]>
  ): ReturnType<TMethodsSchema['updateExpectation']>

  public updateExpectation(predicate: unknown): ReturnType<TMethodsSchema['updateExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.updateExpectation(predicate(this.compileHandlerUtils()))
      : this.methods.updateExpectation(<{ id: string, set: Partial<IExpectationSimplifiedConfiguration<TContext>> }>predicate);
  }

  private compileHandlerUtils<TInput extends IExpectationSchemaInput>(): IExpectationHandlerContext<TContext, TInput> {
    return {
      $: compileExpectationOperators(),
      T: (payload: any) => payload,
    }
  }
}
