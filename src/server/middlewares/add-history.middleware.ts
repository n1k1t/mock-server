import _ from 'lodash';
import { Middleware } from './model';

export default Middleware
  .build(__filename)
  .requires(['expectation'])
  .assignHandler((context, next) => {
    const historyRecord = context.historyStorage
      .register(context.toPlain())
      .assign({ expectation: context.shared.expectation });

    context.webSocketExchange.publish('history:added', historyRecord);
    next({ historyRecord });
  });
