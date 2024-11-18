import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename)
  .assignHandler((context, next) => {
    const plain = context.toPlain();
    const expectation = context.server.storage.expectations.match<any>('request', plain);

    if (!expectation) {
      const historyRecord = context.server.storage.history
        .register(plain)
        .changeState('finished');

      context.server.exchange.ws.publish('history:added', historyRecord);
      return context.reply.notFound();
    }

    expectation.increaseExecutionsCounter();
    context.server.exchange.ws.publish('expectation:updated', expectation);

    return next({ expectation });
  });
