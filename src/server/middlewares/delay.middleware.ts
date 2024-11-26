import _ from 'lodash';

import { Middleware } from '../models';
import { wait } from '../../utils';

export default Middleware
  .build(__filename, ['manipulated'])
  .assignHandler(async (context, { logger }) => {
    if (context.shared.manipulated.incoming.delay) {
      logger.info(`Has delayed over [${context.shared.manipulated.incoming.delay}ms]`);
      await wait(context.shared.manipulated.incoming.delay);
    }
  });
