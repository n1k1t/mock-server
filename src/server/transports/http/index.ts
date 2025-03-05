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
    const { provider, transport } = router.match<HttpTransport>('http', request.url ?? '');

    const context = await transport
      .compileContext(provider, request, response)
      .catch((error) => logger.error('Got error while [http] context compilation', error?.stack ?? error));

    if (!context) {
      return response.end();
    }

    metaStorage
      .wrap(context.meta, () => transport.executor.exec(context, {
        spareExpectationsStorage: provider !== router.defaults.provider
          ? router.defaults.provider.storages.expectations
          : undefined,
      }))
      .catch((error) => {
        logger.error('Get error while [http] execution', error?.stack ?? error);
        response.end();
      });
  }

export class HttpTransport extends Transport<HttpExecutor> {
  public executor = new HttpExecutor();

  public compileContext(provider: Provider, request: IncomingMessage, response: ServerResponse) {
    return HttpRequestContext.build(provider, request, response);
  }
}
