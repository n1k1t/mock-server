import { IncomingMessage, ServerResponse } from 'http';
import rfdc from 'rfdc';
import _ from 'lodash';

import type { Expectation, IExpectationOperatorContext } from '../../../expectations';
import type { IRequestContextOutgoing } from './types';
import type { ServerContext } from '../server-context';
import type { History } from '../../history';

import { extractHttpIncommingParameters } from './utils';
import { metaStorage } from '../../../meta';
import { RequestContext } from './model';
import { Logger } from '../../../logger';
import { Reply } from '../reply';

const logger = Logger.build('Server.Models.HttpRequestContext');
const clone = rfdc();

export class HttpRequestContext<TResponse = unknown> extends RequestContext<'http'> {
  public TPlain!: Pick<HttpRequestContext, 'incoming' | 'outgoing'> & Pick<
    HttpRequestContext['shared'], 'forwarded' | 'state' | 'seed'
  >;

  public incoming = extractHttpIncommingParameters(this.request);
  public outgoing?: IRequestContextOutgoing;

  public reply: Reply<TResponse> = Reply.build(this);
  public meta = metaStorage.generate({
    ...(this.incoming.headers['x-request-id'] && { requestId: String(this.incoming.headers['x-request-id']) }),
  });

  public shared: {
    state: Record<string, unknown>;
    seed?: number;

    expectation?: Expectation<Pick<HttpRequestContext, 'incoming' | 'outgoing'>>;
    manipulated?: IExpectationOperatorContext;

    forwarded?: Pick<HttpRequestContext, 'incoming' | 'outgoing'>;
    history?: History;
  } = {
    state: {},

    ...(this.incoming.headers['x-use-mock-seed'] && {
      seed: Number(this.incoming.headers['x-use-mock-seed']),
    }),

    ...(this.incoming.headers['x-use-mock-state'] && {
      state: JSON.parse(Buffer.from(String(this.incoming.headers['x-use-mock-state']), 'base64').toString()),
    }),
  };

  constructor(
    public server: ServerContext,
    public request: IncomingMessage & { parsed: { raw: string, payload?: object } },
    public response: ServerResponse
  ) {
    super('http', server);
  }

  public share<T extends Partial<HttpRequestContext['shared']>>(shared: T) {
    return Object.assign(this, { shared: Object.assign(this.shared, shared) });
  }

  public assignOutgoing<T extends NonNullable<HttpRequestContext<any>['outgoing']>>(outgoing: T) {
    return Object.assign(this, { outgoing });
  }

  public complete() {
    logger.info(
      `Incoming request [${this.incoming.method} ${this.incoming.path}] has finished`,
      `in [${Date.now() - this.timestamp}ms]`
    );

    return super.complete();
  }

  public toPlain<K extends 'incoming' | 'outgoing' | 'forwarded.incoming' | 'forwarded.outgoing'>(
    options?: {
      locations?: K[];
      clone?: boolean;
    }
  ): HttpRequestContext<TResponse>['TPlain'] {
    const locations = {
      incoming: options?.locations?.includes(<K>'incoming') ?? true,
      outgoing: (options?.locations?.includes(<K>'outgoing') ?? true) && this.outgoing,

      forwarded: {
        incoming: (options?.locations?.includes(<K>'forwarded.incoming') ?? true) && this.shared.forwarded?.incoming,
        outgoing: (options?.locations?.includes(<K>'forwarded.outgoing') ?? true) && this.shared.forwarded?.outgoing,
      },
    };

    return <HttpRequestContext<TResponse>['TPlain']>{
      state: options?.clone ? clone(this.shared.state) : this.shared.state,

      ...(this.shared.seed !== undefined && { seed: this.shared.seed }),
      ...(locations.incoming && { incoming: options?.clone ? clone(this.incoming) : this.incoming }),
      ...(locations.outgoing && { outgoing: options?.clone ? clone(this.outgoing) : this.outgoing }),

      ...((locations.forwarded.incoming || locations.forwarded.outgoing) && {
        forwarded: {
          ...(locations.forwarded.incoming && {
            incoming: options?.clone ? clone(this.shared.forwarded!.incoming) : this.shared.forwarded!.incoming,
          }),

          ...(locations.forwarded.outgoing && {
            outgoing: options?.clone ? clone(this.shared.forwarded!.outgoing) : this.shared.forwarded!.outgoing,
          }),
        },
      }),
    };
  }

  static async build(server: ServerContext, request: IncomingMessage, response: ServerResponse) {
    const parsed = await server.plugins.exec('incoming.body', request);
    return new HttpRequestContext(server, Object.assign(request, { parsed }), response);
  }
}
