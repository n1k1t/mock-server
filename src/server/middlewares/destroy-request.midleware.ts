import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['expectation', 'history'])
  .assignHandler((context, next) => {
    if (context.shared.expectation.destroy) {
      context.shared.history
        .assign({ error: { code: context.shared.expectation.destroy, isManual: true } })
        .changeState('finished');

      context.server.exchange.ws.publish('history:updated', context.shared.history);
      return context.response.destroy(new Error(context.shared.expectation.destroy));
    }

    next();
  });
