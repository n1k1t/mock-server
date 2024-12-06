import { IncomingMessage, ServerResponse } from 'http';
import rfdc from 'rfdc';
import _ from 'lodash';

import type { IRequestContextOutgoing } from './types';
import type { ServerContext } from '../server-context';
import type { Expectation } from '../../../expectations';
import type { History } from '../../history';

import { extractHttpIncommingParameters } from './utils';
import { RequestContextSnapshot } from './snapshot';
import { TRequestPayloadType } from '../../../types';
import { RequestContext } from './model';
import { metaStorage } from '../../../meta';
import { Logger } from '../../../logger';
import { Reply } from '../reply';

const logger = Logger.build('Server.Models.HttpRequestContext');
const clone = rfdc();

export class HttpRequestContext<TResponse = unknown> extends RequestContext<'http'> {
  public incoming = extractHttpIncommingParameters(this.request);
  public outgoing?: IRequestContextOutgoing;

  public reply: Reply<TResponse> = Reply.build(this);
  public meta = metaStorage.generate({
    ...(this.incoming.headers['x-request-id'] && { requestId: String(this.incoming.headers['x-request-id']) }),
  });

  public shared: {
    snapshot: RequestContextSnapshot;

    expectation?: Expectation<any>;
    history?: History;
  } = {
    snapshot: this.compileSnapshot({ clone: true }),
  };

  constructor(
    public server: ServerContext,
    public request: IncomingMessage & { parsed: { raw: string, type?: TRequestPayloadType, payload?: object } },
    public response: ServerResponse
  ) {
    super('http', server);
  }

  public share<T extends Partial<HttpRequestContext['shared']>>(shared: T) {
    return Object.assign(this, { shared: Object.assign(this.shared, shared) });
  }

  public assignExpectation(expectation: NonNullable<HttpRequestContext['shared']['expectation']>) {
    if (this.shared.snapshot.options.cache.isEnabled && expectation.forward?.options?.cache) {
      Object.assign(this.shared.snapshot.options.cache, expectation.forward.options.cache);
    }

    return this.share({ expectation });
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

  public compileSnapshot(options?: { clone?: boolean }): RequestContextSnapshot {
    return RequestContextSnapshot.build({
      storage: this.server.storages.containers,
      state: {},

      options: {
        cache: {
          isEnabled: Boolean(this.server.storages.redis),
        },
      },

      incoming: options?.clone ? clone(this.incoming) : this.incoming,
      outgoing: this.outgoing ? options?.clone ? clone(this.outgoing) : this.outgoing : undefined,

      ...(this.incoming.headers['x-use-mock-seed'] && {
        seed: Number(this.incoming.headers['x-use-mock-seed']),
      }),

      ...(this.incoming.headers['x-use-mock-state'] && {
        state: JSON.parse(Buffer.from(String(this.incoming.headers['x-use-mock-state']), 'base64').toString()),
      }),
    });
  }

  static async build(server: ServerContext, request: IncomingMessage, response: ServerResponse) {
    const parsed = await server.plugins.exec('incoming.body', request);
    return new HttpRequestContext(server, Object.assign(request, { parsed }), response);
  }
}
