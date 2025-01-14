import type { Expectation, IExpectationSchemaInput } from '../../expectations';
import type { IServerContext } from '../../server';
import type { TMethodsSchema } from '../types';
import type { TFunction } from '../../types';

import { compileExpectationOperators, ICompiledExpectationOperators } from '../helpers';

interface IExpectationHandlerContext<
  TContext extends IServerContext<any>,
  TInput extends IExpectationSchemaInput
> {
  $: ICompiledExpectationOperators<TInput & TContext>;
  T: <T>(payload: T) => T extends TFunction<any, any[]> ? TFunction<any, any[]> : T;
};

interface IAnyExpectationInput<TContext extends IServerContext<any>> {
  transport: TContext['transport'];
  state: any;

  incoming: {
    headers: any;
    query: any;
    data: any;
  };

  outgoing: {
    headers: any;
    data: any;
  };
};

type TExpectationAnyConfiguration<TContext extends IServerContext<any>> =
  & Omit<Expectation<TContext>['configuration'], 'schema'>
  & Pick<Expectation<any, any>['configuration'], 'schema'>;

export class Client<TContext extends IServerContext<any>> {
  constructor(protected methods: TMethodsSchema) {}

  public get ping() {
    return this.methods.ping;
  }

  public get deleteExpectations() {
    return this.methods.deleteExpectations;
  }

  public createExpectation(
    configuration: Expectation<IAnyExpectationInput<TContext>>['configuration']
  ): ReturnType<TMethodsSchema['createExpectation']>;

  public createExpectation<TInput extends IExpectationSchemaInput>(
    handler: TFunction<TExpectationAnyConfiguration<TContext>, [IExpectationHandlerContext<TContext, TInput>]>
  ): ReturnType<TMethodsSchema['createExpectation']>;

  public createExpectation(
    predicate:
      | Expectation<IAnyExpectationInput<any>>['configuration']
      | TFunction<TExpectationAnyConfiguration<any>, [IExpectationHandlerContext<any, any>]>
  ): ReturnType<TMethodsSchema['createExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.createExpectation(predicate(this.compileHandlerUtils()))
      : this.methods.createExpectation(predicate);
  }

  public updateExpectation(
    configuration: { id: string, set: Partial<Expectation<IAnyExpectationInput<TContext>>['configuration']> }
  ): ReturnType<TMethodsSchema['updateExpectation']>;

  public updateExpectation<TInput extends IExpectationSchemaInput>(
    handler: TFunction<{ id: string, set: Partial<TExpectationAnyConfiguration<TContext>> }, [
      IExpectationHandlerContext<TContext, TInput>
    ]>
  ): ReturnType<TMethodsSchema['updateExpectation']>

  public updateExpectation(
    predicate:
      | { id: string, set: Partial<Expectation<IAnyExpectationInput<any>>['configuration']> }
      | TFunction<{ id: string, set: Partial<TExpectationAnyConfiguration<any>> }, [
        IExpectationHandlerContext<any, any>
      ]>
  ): ReturnType<TMethodsSchema['updateExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.updateExpectation(predicate(this.compileHandlerUtils()))
      : this.methods.updateExpectation(predicate);
  }

  private compileHandlerUtils<
    TInput extends IExpectationSchemaInput
  >(): IExpectationHandlerContext<TContext, TInput> {
    return {
      $: compileExpectationOperators(),
      T: (payload: any) => payload,
    }
  }
}
