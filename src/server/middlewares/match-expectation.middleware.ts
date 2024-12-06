import _ from 'lodash';

import { IRequestContextOutgoing, Middleware } from '../models';
import { cast } from '../../utils';

export default Middleware
  .build(__filename)
  .assignHandler((context, { logger }) => {
    const expectation = context.server.storages.expectations.match('request', context.shared.snapshot);

    if (!expectation) {
      const history = context.server.storages.history
        .register(
          context.shared.snapshot.assign({
            outgoing: cast<IRequestContextOutgoing>({
              type: 'json',
              status: 404,
              headers: {},
            })
          })
        )
        .switchStatus('finished');

      context.server.exchanges.ws.publish('history:added', history.toPlain());
      return context.reply.notFound();
    }

    logger.info('Has matched with', `"${expectation.name}" [${expectation.id}]`);

    context.server.exchanges.ws.publish('expectation:updated', expectation.toPlain());
    context.assignExpectation(expectation);
  });
