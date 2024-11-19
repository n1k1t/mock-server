import _ from 'lodash';

import { Middleware } from '../models';
import { wait } from '../../utils';

export default Middleware
  .build(__filename, ['manipulated'])
  .assignHandler(async (context, next) => {
    if (context.shared.manipulated.incoming.delay) {
      await wait(context.shared.manipulated.incoming.delay);
    }

    next();
  });
