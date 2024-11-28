import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['expectation'])
  .assignHandler((context) => {
    const history = context.server.storage.history
      .register(context.toPlain({ locations: ['incoming'] }))
      .assignExpectation(context.shared.expectation);

    context.server.exchange.ws.publish('history:added', history.toPlain());
    context.share({ history });
  });
