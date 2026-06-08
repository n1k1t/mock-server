import { ParsedUrlQueryInput } from 'querystring';
import _ from 'lodash';

import type { Expectation, IExpectationSchemaForward } from '../../../expectations';
import type { WsRequestContext } from './context';

import { formatHeaders } from '../../../utils';
import { Logger } from '../../../logger';
import {
  Executor,
  ExecutorManualError,
  IExecutorExecOptions,
  IRequestContextForwarded,
  IRequestContextIncoming,
  IRequestContextOutgoing,
  IWebSocketConfiguration,
  WebSocketFactory,
  RequestMessage,
} from '../../models';

const logger = Logger.build('Transports.Ws.Executor');

/** Got from `ws` package */
const checkStatusIsValid = (code: number) =>
  (code >= 1000 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006) ||
  (code >= 3000 && code <= 4999);

export class WsExecutor extends Executor<WsRequestContext> {
  public async exec(context: WsRequestContext, options?: IExecutorExecOptions): Promise<WsRequestContext> {
    context.socket.once('close', () => context.complete());
    context.socket.on('message', (data) => RequestMessage.build(data));

    await super.exec(context, options).catch((error) => {
      if (error instanceof ExecutorManualError && error.is('ECONNABORTED')) {
        return context.socket.destroy();
      }

      logger.error('Got unexpected error while execution', error?.stack ?? error);
    });

    return context;
  }

  public async match(context: WsRequestContext): Promise<Expectation | null> {
    const expectation = await context.provider.storages.expectations.match(context.snapshot);

    if (!expectation) {
      context.skip();
      return null;
    }

    return expectation;
  }

  public async forward(
    context: WsRequestContext,
    incoming: IRequestContextIncoming,
    schema: IExpectationSchemaForward
  ): Promise<IRequestContextForwarded | null> {
    const configuration = await this
      .compileForwardingConfiguration(context, incoming, schema)
      .catch((error) => {
        context.snapshot.assign({
          error: { code: 'UNKNOWN', message: error?.message ?? 'Unknown' },
          outgoing: { type: 'plain', status: 1006, headers: {} },
        });

        logger.error('Got error while execution [compileForwardingConfiguration] method', error?.stack ?? error);
        throw error;
      });

    context.additional.ws = WebSocketFactory
      .build(configuration)
      .compile()
      .connect();

    return {
      schema,
      incoming,

      outgoing: {
        type: 'plain',
        status: 0,

        headers: await context.additional.ws.headers(),
        stream: context.additional.ws.observable,
      },
    };
  }

  public async reply(
    context: WsRequestContext,
    outgoing: IRequestContextOutgoing
  ): Promise<IRequestContextOutgoing> {
    await new Promise<void>((resolve) => {
      context.provider.server.wss.once('headers', (headers) => {
        const formatted = formatHeaders(outgoing.headers);

        Object.entries(formatted).forEach(([key, value]) =>
          headers.some((line) => line.toLowerCase().startsWith(`${key}:`))
            ? null
            : headers.push([key, value].join(': '))
        );
      });

      context.provider.server.wss.handleUpgrade(context.request, context.socket, context.head, async (socket) => {
        await outgoing.stream?.forEach((payload: unknown) => {
          const message = payload instanceof RequestMessage
            ? payload
            : RequestMessage.build(payload);

          context.streams.outgoing.next(message);
          socket.send(message.serialize());
        });

        const status = await context.additional.ws?.status() ?? null;

        if (outgoing.status === 0) {
          outgoing.status = status ?? 1000;
        }
        if (context.snapshot.forwarded?.outgoing) {
          context.snapshot.forwarded.outgoing.status = status ?? outgoing.status;
        }

        if (!checkStatusIsValid(outgoing.status)) {
          const fallback = status !== null
            ? checkStatusIsValid(status)
              ? status
              : 1000
            : 1000;

          logger.warn(`Outgoing status [${outgoing.status}] is invalid. Fallback to [${fallback}]`);
          outgoing.status = fallback;
        }

        socket.close(outgoing.status);
        resolve();
      });
    });

    return outgoing;
  }

  /** Compiles WS request configuration to forward */
  protected async compileForwardingConfiguration(
    context: WsRequestContext,
    incoming: IRequestContextIncoming,
    schema: IExpectationSchemaForward
  ): Promise<IWebSocketConfiguration> {
    const url = new URL(schema.url ?? incoming.path, schema.baseUrl);

    return {
      timeout: schema.timeout,

      headers: formatHeaders(
          Object.assign(incoming.headers, {
          ...(schema.options?.overrideHost !== false && { host: url.host }),
        })
      ),

      ...(schema.url && { url: schema.url }),
      ...(schema.baseUrl && { baseURL: schema.baseUrl, url: incoming.path }),

      query: <ParsedUrlQueryInput>context.incoming.query,
    };
  }
}
