import { IncomingMessage, ServerResponse } from 'http';

import { IHttpRequestIncommingContext, IRequestPlainContext, IResponsePlainContext, TRequestFlow } from './types';
import { TRequestMethod, TRequestPayloadType } from '../../../types';
import { extractHttpIncommingParameters } from './utils';
import type { Expectation } from '../../../expectations';
import type { HistoryRecord } from '../../history';
import { ServerContext } from '../server-context';
import { ReplyService } from '../reply-service';

export * from './types';

export class RequestContext<
  T extends IHttpRequestIncommingContext = IHttpRequestIncommingContext,
  U = unknown
> extends ServerContext implements IRequestPlainContext<T> {
  public method = <TRequestMethod>'';
  public path = '';

  public payloadType: TRequestPayloadType = 'plain';

  public body: T['body'] = undefined;
  public bodyRaw = '';

  public query = <T['query']>{};
  public headers = <T['headers']>{};

  public http?: {
    request: IncomingMessage;
    response: ServerResponse;
  };

  public ws?: {
    callback: TFunction<void>;
  };

  public flow: TRequestFlow = 'http';
  public reply = ReplyService.build<U>(this);

  public shared: {
    expectation?: Expectation;
    historyRecord?: HistoryRecord;
    forwarded?: {
      request: IRequestPlainContext;
      response: IResponsePlainContext;
    }
  } = {};

  public isFlow<K extends TRequestFlow>(flow: K): this is SetRequiredKeys<this, K> {
    return this.flow === flow;
  }

  public extendWithServerContext<Q extends ServerContext>(context: Q) {
    return Object.assign(this, context);
  }

  public extendShared<Q extends Partial<RequestContext<T, U>['shared']>>(sourceShared: Q) {
    const shared = Object.assign(this.shared, sourceShared);
    return Object.assign(this, { shared });
  }

  public assignFlow<K extends TRequestFlow>(
    flow: K,
    flowContext: NonNullable<RequestContext<T, U>[K]>
  ): this & { [KN in K]: NonNullable<RequestContext<T, U>[K]> } & { flow: K } {
    return Object.assign(this, { flow, [flow]: flowContext });
  }

  public assignPayloadType<K extends TRequestPayloadType>(payloadType: K) {
    return Object.assign(this, { payloadType });
  }

  public async prepareHttpIncommingContext<Q extends SetRequiredKeys<RequestContext, 'http'>>(this: Q) {
    const details = await extractHttpIncommingParameters(this.http.request);
    return Object.assign(this, details);
  }

  public assign<T extends Partial<IRequestPlainContext>>(context: T) {
    return Object.assign(this, context);
  }

  public toPlain(): IRequestPlainContext {
    return {
      path: this.path,
      method: this.method,
      headers: this.headers,

      payloadType: this.payloadType,
      query: this.query,

      body: this.body,
      bodyRaw: this.bodyRaw
    }
  }

  static build<T extends IHttpRequestIncommingContext = IHttpRequestIncommingContext>() {
    return new RequestContext<T>();
  }
}
