import { IncomingMessage, ServerResponse, createServer } from 'http';
import { Server } from 'socket.io';
import _ from 'lodash';

import { RequestContext, ServerContext } from './models';
import { IMockServerStartOptions } from './types';
import { internalEndpointsMap } from './router';

import * as middlewares from './middlewares';

export * from './proxy';
export * from './types';

const middlewaresToUse = [
  middlewares.resolvePublicMiddleware,
  middlewares.handleInternalMiddleware,
  middlewares.validateExpectationRequestMiddleware,
  middlewares.addHistoryMiddleware,
  middlewares.handleExpectationForwardMiddleware,
  middlewares.handleExpectationDelayMiddleware,
  middlewares.buildDestroyRequestMiddleware,
  middlewares.replyMiddleware,
];

const handleHttpRequestWithMiddlewares = (
  context: SetRequiredKeys<RequestContext, 'http'> & { shared: any },
  position: number = 0
): unknown => middlewaresToUse[position]?.compile(context).exec(
  context,
  (result?: object) => handleHttpRequestWithMiddlewares(context.extendShared(result ?? {}), ++position)
);

const httpRequestListener = (serverContext: ServerContext) =>
  async (request: IncomingMessage, response: ServerResponse) => {
    const requestContext = await RequestContext
      .build()
      .extendWithServerContext(serverContext)
      .assignFlow('http', { request, response })
      .prepareHttpIncommingContext();

    return handleHttpRequestWithMiddlewares(requestContext);
  }

export class MockServer {
  public authority = `http://${this.options.host}:${this.options.port}`;
  public context = ServerContext.build();

  constructor(public options: IMockServerStartOptions) {}

  get client() {
    return this.context.client;
  }

  static async start(options: IMockServerStartOptions) {
    const server = new MockServer(options);

    const http = createServer(httpRequestListener(server.context));
    const webSocket = new Server(http);

    webSocket.on('connection', (socket) =>
      Object.values(internalEndpointsMap.ws).forEach((route) =>
        socket.on(route.webSocket.path, (...args) =>
          route.handler?.(
            RequestContext
              .build()
              .extendWithServerContext(server.context)
              .assignFlow('ws', { callback: _.last(args) })
              .assign({ body: _.first(args) })
        ))
      )
    );

    server.context.assignWebSocketExchange(webSocket);

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
