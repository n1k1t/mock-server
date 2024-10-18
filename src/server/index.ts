import { IncomingMessage, ServerResponse, createServer } from 'http';
import { Server } from 'socket.io';
import _ from 'lodash';

import { RequestContext, ServerContext } from './models';
import { IStartHttpServerOptions } from './types';
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
  context: SetRequiredKeys<RequestContext, 'http' | 'webSocketExchange'> & { shared: any },
  position: number = 0
): unknown => middlewaresToUse[position]?.compile(context).exec(
  context,
  (result?: object) => handleHttpRequestWithMiddlewares(context.extendShared(result ?? {}), ++position)
);

const httpRequestListener = (serverContext: SetRequiredKeys<ServerContext, 'webSocketExchange'>) =>
  async (request: IncomingMessage, response: ServerResponse) => {
    const requestContext = await RequestContext
      .build()
      .extendWithServerContext(serverContext)
      .assignFlow('http', { request, response })
      .prepareHttpIncommingContext();

    return handleHttpRequestWithMiddlewares(requestContext);
  }

export const startMockServer = async ({ port, host }: IStartHttpServerOptions) => {
  const serverContext = ServerContext
    .build()
    .buildWebSocketExchange(new Server());

  const httpServer = createServer(httpRequestListener(serverContext));
  const webSocketServer = new Server(httpServer);

  webSocketServer.on('connection', (socket) =>
    Object.values(internalEndpointsMap.ws).forEach((route) =>
      socket.on(route.webSocket.path, (...args) =>
        route.handler?.(
          RequestContext
            .build()
            .extendWithServerContext(serverContext)
            .assignFlow('ws', { callback: _.last(args) })
            .assign({ body: _.first(args) })
      ))
    )
  );

  serverContext.buildWebSocketExchange(webSocketServer);

  return new Promise<void>((resolve) =>
    httpServer.listen(port, host, () => {
      const authority = `http://${host}:${port}`;

      console.log(`Server has started on [${authority}]`);
      console.log(`GUI is available on [${authority}/_mock/gui]`);

      resolve();
    })
  );
}
