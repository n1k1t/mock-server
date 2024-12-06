import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['history'])
  .assignHandler((context, { logger }) => {
    if (context.shared.snapshot.incoming.error) {
      context.shared.history.snapshot.assign({ error: { code: context.shared.snapshot.incoming.error, isManual: true } });
      context.shared.history.switchStatus('finished');

      context.server.exchanges.ws.publish('history:updated', context.shared.history.toPlain());
      logger.info(`Has destroyed using [${context.shared.snapshot.incoming.error}]`);

      context.response.destroy(new Error(context.shared.snapshot.incoming.error));
      context.complete();
    }
  });
