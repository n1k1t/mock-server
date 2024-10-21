import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename)
  .assignHandler((context, next) => {
    const plainContext = context.toPlain();
    const expectation = context.storage.expectations.findByContext('request', plainContext);

    if (!expectation) {
      const historyRecord = context.storage.history
        .register(plainContext)
        .changeState('finished');

      context.exchange.ws.publish('history:added', historyRecord);
      return context.reply.notFound();
    }

    expectation.increaseExecutionsCounter();
    context.exchange.ws.publish('expectation:updated', expectation);

    return next({ expectation });
  });
