import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['expectation'])
  .assignHandler((context) => {
    const history = context.server.storages.history
      .register(context.compileSnapshot().assign(_.omit(context.shared.snapshot, ['incoming'])))
      .assignExpectation(context.shared.expectation);

    context.server.exchanges.ws.publish('history:added', history.toPlain());
    context.share({ history });
  });
