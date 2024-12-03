import { IncomingMessage, ServerResponse, createServer } from 'http';
import { Server } from 'socket.io';
import _ from 'lodash';

import { HttpRequestContext, Middleware, ServerContext, WsRequestContext } from './models';
import { metaStorage } from '../meta';
import { Logger } from '../logger';
import { routes } from './router';

import * as middlewares from './middlewares';

export { serializePayload, parsePayload } from './models';

const logger = Logger.build('Server');

const middlewaresToUse: Middleware<any, any>['TCompiled'][] = [
  middlewares.publicMiddleware,
  middlewares.internalMiddleware,
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
    if (context.completed || context.response.closed) {
      break;
    }
    if (!middleware.required.every((key) => key in context.shared)) {
      logger.warn(`Middleware [${middleware.name}] has skiped`);
      continue;
    }

    await middleware.exec(context).catch((error) => {
      logger.error(`Got error while middleware [${middleware.name}] execution`, error?.stack ?? error);
      context.complete();
    });
  }
};

const httpRequestListener = (server: ServerContext) =>
  async (request: IncomingMessage, response: ServerResponse) => {
    const context = await HttpRequestContext.build(server, request, response);

    logger.info('Incoming request', `[${context.incoming.method} ${context.incoming.path}]`);

    await metaStorage
      .wrap(context.meta, () => handleHttpRequest(context))
      .catch((error) => {
        logger.error('Get error while handling incoming request', error?.stack ?? error);
        response.end();
      });
  }

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
        logger.info(`Server has started on [${server.authority}]`);
        logger.info(`GUI is available on [${server.authority}/_mock/gui]`);

        resolve();
      })
    );

    return server;
  }
}
