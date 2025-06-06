import type { Expectation, IExpectationSchema, IExpectationSchemaInput } from '../../expectations';
import type { ICompiledExpectationOperators } from '../helpers';
import type { IServerContext } from '../../server';
import type { TFunction } from '../../../types';

export interface IExpectationHandlerContext<
  TContext extends IServerContext,
  TInput extends IExpectationSchemaInput
> {
  $: ICompiledExpectationOperators<TInput & TContext>;
  T: <T>(payload: T) => T extends TFunction<any, any[]> ? TFunction<any, any[]> : T;
};

export interface IExpectationSimplifiedInput<TContext extends IServerContext> {
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

export interface IExpectationSimplifiedConfiguration<TContext extends IServerContext> extends Omit<
  Expectation<TContext>['configuration'],
  'schema'
> {
  schema: Omit<IExpectationSchema<any>, 'request' | 'response'> & {
    request?: object;
    response?: object;
  };
};
