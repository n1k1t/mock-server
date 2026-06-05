import type { ICompiledExpectationOperators } from '../helpers';
import type { IExpectationSchemaContext } from '../../expectations';

export interface IExpectationHandlerContext<TContext extends IExpectationSchemaContext<any>> {
  $: ICompiledExpectationOperators<TContext>;

  utils: {
    transports: <K extends TContext['transport']>(values: K[]) => K[];
  };
};
