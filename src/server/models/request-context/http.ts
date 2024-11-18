import { IncomingMessage, ServerResponse } from 'http';
import rfdc from 'rfdc';
import _ from 'lodash';

import type { IRequestContextOutgoing } from './types';
import type { ServerContext } from '../server-context';
import type { Expectation } from '../../../expectations';
import type { History } from '../../history';

import { extractHttpIncommingParameters } from './utils';
import { RequestContext } from './model';
import { ReplyService } from '../reply-service';

type THttpRequestContextPlain = Pick<HttpRequestContext, 'incoming' | 'outgoing'> & {
  forwarded?: NonNullable<HttpRequestContext['shared']['forwarded']>;
};

const clone = rfdc();

export class HttpRequestContext<TResponse = unknown> extends RequestContext<'http'> {
  public reply: ReplyService<TResponse> = ReplyService.build(this);

  public incoming = extractHttpIncommingParameters(this.request);
  public outgoing?: IRequestContextOutgoing;

  public shared: {
    expectation?: Expectation<Pick<HttpRequestContext, 'incoming' | 'outgoing'>>;
    history?: History;
    forwarded?: Pick<HttpRequestContext, 'incoming' | 'outgoing'>;
  } = {};

  constructor(
    public server: ServerContext,
    public request: IncomingMessage & { incomingBodyRaw: string },
    public response: ServerResponse
  ) {
    super('http', server);
  }

  public share<T extends Partial<HttpRequestContext['shared']>>(shared: T) {
    return Object.assign(this, { shared: Object.assign(this.shared, shared) });
  }

  public toPlain<K extends 'incoming' | 'outgoing' | 'forwarded.incoming' | 'forwarded.outgoing'>(
    options?: {
      locations?: K[];
      clone?: boolean;
    }
  ): THttpRequestContextPlain {
    return <THttpRequestContextPlain>{
      ...((options?.locations?.includes(<K>'incoming') ?? true) && {
        incoming: options?.clone ? clone(this.incoming) : this.incoming,
      }),

      ...(((options?.locations?.includes(<K>'outgoing') ?? true) && this.outgoing) && {
        outgoing: options?.clone ? clone(this.outgoing) : this.outgoing,
      }),

      forwarded: {
        ...(((options?.locations?.includes(<K>'forwarded.incoming') ?? true) && this.shared.forwarded?.incoming) && {
          incoming: options?.clone ? clone(this.shared.forwarded.incoming) : this.shared.forwarded.incoming,
        }),

        ...(((options?.locations?.includes(<K>'forwarded.outgoing') ?? true) && this.shared.forwarded?.outgoing) && {
          outgoing: options?.clone ? clone(this.shared.forwarded.outgoing) : this.shared.forwarded.outgoing,
        }),
      },
    };
  }

  static async build(server: ServerContext, request: IncomingMessage, response: ServerResponse) {
    let incomingBodyRaw = '';

    request.on('data', chunk => incomingBodyRaw += chunk);
    await new Promise(resolve => request.on('end', resolve));

    return new HttpRequestContext(server, Object.assign(request, { incomingBodyRaw }), response);
  }
}
