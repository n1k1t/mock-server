import _ from 'lodash';
import { Middleware } from './model';

export default Middleware
  .build(__filename)
  .assignHandler((context, next) => {
    const plainContext = context.toPlain();
    const expectation = context.expectationsStorage.findByContext('request', plainContext);

    if (!expectation) {
      const historyRecord = context.historyStorage
        .register(plainContext)
        .changeState('finished');

      context.webSocketExchange.publish('history:added', historyRecord);
      return context.reply.notFound();
    }

    expectation.increaseExecutionsCounter();
    context.webSocketExchange.publish('expectation:updated', expectation);

    return next({ expectation });
  });
