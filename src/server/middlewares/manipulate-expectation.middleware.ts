import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['expectation'])
  .assignHandler((context, next) => {
    const manipulated = context.shared.expectation.request?.manipulate(
      context.toPlain({ clone: true, locations: ['incoming'] })
    );

    return next({
      manipulated,
      ...(manipulated?.seed !== undefined && { seed: manipulated.seed }),
    });
  });
