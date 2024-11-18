import type { IExpectationOperatorContext, TBuildExpectationConfiguration } from '../../expectations';
import type { TMethodsSchema } from '../types';

import { compileExpectationOperators, ICompiledExpectationOperators } from '../helpers';

interface IExpectationHandlerContext<T extends PartialDeep<IExpectationOperatorContext>> {
  $: ICompiledExpectationOperators<T>;
  T: <T>(payload: T) => T extends TFunction<any, any[]> ? TFunction<any, any[]> : T;
}

interface IUnknownExpectationContext {
  incoming: IExpectationOperatorContext['incoming'] & {
    headers: any;
    query: any;
    body: any;
  };

  outgoing?: IExpectationOperatorContext['outgoing'] & {
    headers: any;
    data: any;
  };
}

export class Client {
  constructor(protected methods: TMethodsSchema) {}

  public get ping() {
    return this.methods.ping;
  }

  public get deleteExpectations() {
    return this.methods.deleteExpectations;
  }

  public createExpectation<T extends PartialDeep<IExpectationOperatorContext> = {}>(
    predicate: TBuildExpectationConfiguration<IUnknownExpectationContext> | TFunction<
      TBuildExpectationConfiguration<any>,
      [IExpectationHandlerContext<T>]
    >
  ): ReturnType<TMethodsSchema['createExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.createExpectation(predicate({
        $: compileExpectationOperators<T>(),
        T: (payload: any) => payload,
      }))
      : this.methods.createExpectation(predicate);
  }

  public updateExpectation<T extends Partial<IExpectationOperatorContext>>(
    predicate: { id: string, set: Partial<Omit<TBuildExpectationConfiguration, 'type'>> } | TFunction<
      { id: string, set: Partial<Omit<TBuildExpectationConfiguration<any>, 'type'>> },
      [IExpectationHandlerContext<T>]
    >
  ): ReturnType<TMethodsSchema['updateExpectation']> {
    return typeof predicate === 'function'
      ? this.methods.updateExpectation(predicate({
        $: compileExpectationOperators<T>(),
        T: (payload: any) => payload,
      }))
      : this.methods.updateExpectation(predicate);
  }
}
