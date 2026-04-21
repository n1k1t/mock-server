import { IncomingMessage, ServerResponse } from 'http';

import { Provider, Router, Transport } from '../../models';
import { HttpRequestContext } from './context';
import { HttpExecutor } from './executor';
import { metaStorage } from '../../../meta';
import { Logger } from '../../../logger';

export * from './executor';
export * from './context';

const logger = Logger.build('Server.Transports.Http');

export const buildHttpListener = <T extends HttpRequestContext['TContext']>(router: Router<T>) =>
  async (request: IncomingMessage, response: ServerResponse) => {
    for (const { provider, transport } of router.match<HttpTransport>('http', request.url ?? '')) {
      const context = await transport
        .compileContext(provider, request, response)
        .catch((error) => logger.error('Got error while context compilation', error?.stack ?? error));

      if (!context) {
        return response.destroy();
      }
      if (!context.is(['registered', 'handling'])) {
        return null;
      }

      const expectation = await metaStorage
        .wrap(context.meta, () => transport.executor.match(context))
        .catch((error) => logger.error('Got error while expectation matching', error?.stack ?? error));

      if (!context.is(['registered', 'handling'])) {
        return null;
      }

      if (!expectation) {
        context.cancel();
        continue;
      }

      await metaStorage
        .wrap(context.meta, () => transport.executor.exec(context.handle(), { expectation }))
        .catch((error) => logger.error('Got error while execution', error?.stack ?? error));

      return null;
    }

    const { transport, provider } = router.default<HttpTransport>('http');
    const context = await transport.compileContext(provider, request, response);

    await metaStorage
      .wrap(context.meta, () => transport.executor.exec(context.handle()))
      .catch((error) => logger.error('Got error while execution', error?.stack ?? error));

    // Nothing matched — neither any registered provider nor the default one
    // produced an outgoing payload (no forwarder, no expectation). The 404
    // used to be emitted eagerly from `HttpExecutor.match`, but that broke
    // multi-provider fallback. Send it here once, as the final step, if the
    // response is still open.
    if (!response.headersSent && response.writable) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('Expectation was not found');
    }
  }

export class HttpTransport extends Transport<HttpExecutor> {
  public executor = new HttpExecutor();

  public compileContext(
    provider: Provider<HttpTransport['TContext']>,
    request: IncomingMessage,
    response: ServerResponse
  ) {
    return HttpRequestContext.build(provider, request, response);
  }
}
