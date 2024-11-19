import { IncomingMessage, ServerResponse, createServer } from 'http';
import { Server } from 'socket.io';
import _ from 'lodash';

import { HttpRequestContext, Middleware, ServerContext, WsRequestContext } from './models';
import { routes } from './router';

import * as middlewares from './middlewares';

export * from './proxy';

const middlewaresToUse: Middleware<any, any>['TCompiled'][] = [
  middlewares.publicMiddleware,
  middlewares.handleInternalMiddleware,
  middlewares.matchExpectationMiddleware,
  middlewares.manipulateExpectationMiddleware,
  middlewares.historyMiddleware,
  middlewares.delayMiddleware,
  middlewares.destroyMiddleware,
  middlewares.forwardMiddleware,
  middlewares.replyMiddleware,
];

const handleHttpRequest = async (context: HttpRequestContext) => {
  for (const middleware of middlewaresToUse) {
    if (!middleware.required.every((key) => key in context.shared)) {
      continue;
    }

    await new Promise((resolve) => middleware.exec(context, (result) => resolve(context.share(result ?? {}))));
  }
};

const httpRequestListener = (context: ServerContext) =>
  async (request: IncomingMessage, response: ServerResponse) =>
    handleHttpRequest(await HttpRequestContext.build(context, request, response));

export class MockServer {
  public authority = `http://${this.options.host}:${this.options.port}`;
  public context = ServerContext.build();

  constructor(public options: {
    port: number;
    host: string;
  }) {}

  get client() {
    return this.context.client;
  }

  static async start(options: MockServer['options']) {
    const server = new MockServer(options);

    const http = createServer(httpRequestListener(server.context));
    const ws = new Server(http);

    ws.on('connection', (socket) =>
      Object.values(routes.ws).forEach((route) =>
        socket.on(route.ws.path, (...args) =>
          route.handler?.(
            WsRequestContext.build(server.context, {
              callback: _.last(args),
              body: _.first(args)
            })
        ))
      )
    );

    server.context.assignWsExchange(ws);

    await new Promise<void>((resolve) =>
      http.listen(options.port, options.host, () => {
        console.log(`Server has started on [${server.authority}]`);
        console.log(`GUI is available on [${server.authority}/_mock/gui]`);

        resolve();
      })
    );

    return server;
  }
}
