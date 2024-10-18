import _ from 'lodash';

import { wait } from '../../utils';
import { Middleware } from './model';

export default Middleware
  .build(__filename)
  .requires(['expectation'])
  .assignHandler(async (context, next) => {
    if (context.shared.expectation.delay) {
      await wait(_.flatten([context.shared.expectation.delay])[0].ms);
    }

    next();
  });
