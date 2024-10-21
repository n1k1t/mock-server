import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename)
  .requires(['expectation'])
  .assignHandler((context, next) => {
    const historyRecord = context.storage.history
      .register(context.toPlain())
      .assign({ expectation: context.shared.expectation });

    context.exchange.ws.publish('history:added', historyRecord);
    next({ historyRecord });
  });
