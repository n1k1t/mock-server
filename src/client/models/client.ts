import type { TMethodsSchema } from '../types';
import type { TFunction } from '../../types';
import type {
  IExpectationOperatorContext,
  IExpectationOperatorContextInput,
  TBuildExpectationConfiguration,
} from '../../expectations';

import { compileExpectationOperators, ICompiledExpectationOperators } from '../helpers';

interface IExpectationHandlerContext<TInput extends IExpectationOperatorContextInput> {
  $: ICompiledExpectationOperators<TInput>;
  T: <T>(payload: T) => T extends TFunction<any, any[]> ? TFunction<any, any[]> : T;
}

type TUnknownExpectationContext = IExpectationOperatorContext<{
  incoming: {
    headers: any;
    query: any;
    body: any;
  };

  outgoing?: {
    headers: any;
    data: any;
  };
}>

export class Client {
  constructor(protected methods: TMethodsSchema) {}

  public get ping() {
    return this.methods.ping;
  }

  public get deleteExpectations() {
    return this.methods.deleteExpectations;
  }

  public createExpectation<TInput extends IExpectationOperatorContextInput = {}>(
    predicate: TBuildExpectationConfiguration<TUnknownExpectationContext> | TFunction<
      TBuildExpectationConfiguration<any>,
      [IExpectationHandlerContext<TInput>]
    >
  ): ReturnType<TMethodsSchema['createExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.createExpectation(predicate({
        $: compileExpectationOperators<TInput>(),
        T: (payload: any) => payload,
      }))
      : this.methods.createExpectation(predicate);
  }

  public updateExpectation<TInput extends IExpectationOperatorContextInput = {}>(
    predicate: {
      id: string,
      set: Partial<Omit<TBuildExpectationConfiguration<TUnknownExpectationContext>, 'type'>>
    } | TFunction<
      { id: string, set: Partial<Omit<TBuildExpectationConfiguration<any>, 'type'>> },
      [IExpectationHandlerContext<TInput>]
    >
  ): ReturnType<TMethodsSchema['updateExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.updateExpectation(predicate({
        $: compileExpectationOperators<TInput>(),
        T: (payload: any) => payload,
      }))
      : this.methods.updateExpectation(predicate);
  }
}
