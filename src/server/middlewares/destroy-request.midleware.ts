import _ from 'lodash';
import { Middleware } from './model';

export default Middleware
  .build(__filename)
  .requires(['expectation', 'historyRecord'])
  .assignHandler((context, next) => {
    if (context.shared.expectation.destroy) {
      context.shared.historyRecord
        .assign({ error: { code: context.shared.expectation.destroy, isManual: true } })
        .changeState('finished');

      context.webSocketExchange.publish('history:updated', context.shared.historyRecord);
      return context.http.response.destroy(new Error(context.shared.expectation.destroy));
    }

    next();
  });
