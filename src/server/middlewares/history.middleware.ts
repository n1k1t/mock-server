import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['expectation'])
  .assignHandler((context) => {
    const history = context.server.storages.history
      .register(
        context
          .compileSnapshot()
          .assign(context.shared.snapshot.omit(['incoming']))
          .unset(['outgoing'])
      )
      .assignExpectation(context.shared.expectation);

    context.server.exchanges.ws.publish('history:added', history.toPlain());
    context.share({ history });
  });
