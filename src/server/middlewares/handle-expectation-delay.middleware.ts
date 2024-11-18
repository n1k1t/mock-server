import _ from 'lodash';

import { Middleware } from '../models';
import { wait } from '../../utils';

export default Middleware
  .build(__filename, ['expectation'])
  .assignHandler(async (context, next) => {
    if (context.shared.expectation.delay) {
      await wait(_.flatten([context.shared.expectation.delay])[0].ms);
    }

    next();
  });
