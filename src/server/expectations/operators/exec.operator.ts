import _ from 'lodash';

import { buildExpectationOperatorHandler } from './utils';
import { IRequestPlainContext, IResponsePlainContext } from '../../models';

export type TExpectationExecOperatorHandler<TContext extends IRequestPlainContext | IResponsePlainContext> =
  TFunction<unknown, [{ _: typeof _, context: TContext }]>;

export default buildExpectationOperatorHandler<'$exec'>(
  (mode, command, context) => {
    if (mode !== 'manipulation') {
      return true;
    }

    Function(`return ({ _, context }) => ${command}`)()({ _, context });
    return true;
  }
);
