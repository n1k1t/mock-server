import _ from 'lodash';

import { Middleware } from '../models';
import { wait } from '../../utils';

export default Middleware
  .build(__filename)
  .assignHandler(async (context, { logger }) => {
    if (context.shared.snapshot.incoming.delay) {
      logger.info(`Has delayed over [${context.shared.snapshot.incoming.delay}ms]`);
      await wait(context.shared.snapshot.incoming.delay);
    }
  });
