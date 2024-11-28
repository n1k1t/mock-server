import _ from 'lodash';

import { IRequestContextOutgoing, Middleware } from '../models';
import { cast } from '../../utils';

export default Middleware
  .build(__filename)
  .assignHandler((context, { logger }) => {
    const plain = context.toPlain({ clone: true, locations: ['incoming'] });
    const expectation = context.server.storage.expectations.match<any>('request', plain);

    if (!expectation) {
      const history = context.server.storage.history
        .register(Object.assign(plain, {
          outgoing: cast<IRequestContextOutgoing>({
            type: 'json',
            status: 404,
            headers: {},
          })
        }))
        .switchState('finished');

      context.server.exchange.ws.publish('history:added', history.toPlain());
      return context.reply.notFound();
    }

    logger.info('Has matched with', `"${expectation.name}" [${expectation.id}]`);

    context.server.exchange.ws.publish('expectation:updated', expectation.toPlain());
    context.share({ expectation });
  });
