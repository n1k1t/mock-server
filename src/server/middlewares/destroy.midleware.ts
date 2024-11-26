import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['manipulated', 'history'])
  .assignHandler((context, { logger }) => {
    if (context.shared.manipulated.incoming.error) {
      context.shared.history
        .assign({ error: { code: context.shared.manipulated.incoming.error, isManual: true } })
        .changeState('finished');

      context.server.exchange.ws.publish('history:updated', context.shared.history.toPlain());
      logger.info(`Has destroyed using [${context.shared.manipulated.incoming.error}]`);

      context.response.destroy(new Error(context.shared.manipulated.incoming.error));
      context.complete();
    }
  });
