import { IncomingMessage, ServerResponse } from 'http';

import { Provider, Router, Transport } from '../../models';
import { HttpRequestContext } from './context';
import { HttpExecutor } from './executor';
import { metaStorage } from '../../../meta';
import { Logger } from '../../../logger';

export * from './executor';
export * from './context';

const logger = Logger.build('Server.Transports.Http');

export const buildHttpListener = (router: Router<HttpRequestContext['TContext']>) =>
  async (request: IncomingMessage, response: ServerResponse) => {
    for (const { provider, transport } of router.match<HttpTransport>('http', request.url ?? '')) {
      const context = await transport
        .compileContext(provider, request, response)
        .catch((error) => logger.error('Got error while context compilation', error?.stack ?? error));

      if (!context) {
        return response.destroy();
      }
      if (!context.hasStatus('handling')) {
        break;
      }

      const expectation = await metaStorage
        .wrap(context.meta, () => transport.executor.match(context))
        .catch((error) => logger.error('Got error while expectation matching', error?.stack ?? error));

      if (!context.hasStatus('handling')) {
        break;
      }
      if (!expectation) {
        continue
      }

      await metaStorage
        .wrap(context.meta, () => transport.executor.exec(context, { expectation }))
        .catch((error) => logger.error('Got error while execution', error?.stack ?? error));

      break;
    }
  }

export class HttpTransport extends Transport<HttpExecutor> {
  public executor = new HttpExecutor();

  public compileContext(provider: Provider, request: IncomingMessage, response: ServerResponse) {
    return HttpRequestContext.build(provider, request, response);
  }
}
