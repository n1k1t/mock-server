import { v4 as genUid } from 'uuid';

import type { IHistoryRecordMeta } from './types';
import type { HttpRequestContext } from '../models';
import type { Expectation } from '../../expectations';

export class History {
  public TPlain!: Pick<History, 'id' | 'forwaded' | 'error' | 'meta' | 'request'> & {
    expectation?: Expectation<any>['TPlain'];
  }

  public id: string = genUid();

  public expectation?: Expectation<any>;
  public forwaded?: Pick<HttpRequestContext, 'incoming' | 'outgoing'>;

  public error?: {
    code?: string;
    message?: string;
    isManual?: boolean;
  };

  public meta: IHistoryRecordMeta = {
    state: 'pending',

    requestedAt: Date.now(),
    updatedAt: Date.now(),
  };

  constructor(public request: Pick<HttpRequestContext, 'incoming' | 'outgoing'>) {}

  public changeState(state: IHistoryRecordMeta['state']): this {
    Object.assign(this.meta, { state, updatedAt: Date.now() });
    return this;
  }

  public assign<T extends Partial<Omit<History, 'id' | 'request' | 'meta'>>>(context: T) {
    Object.assign(this.meta, { updatedAt: Date.now() });
    return Object.assign(this, context);
  }

  public assignOutgoing(outgoing: NonNullable<HttpRequestContext['outgoing']>) {
    this.meta.updatedAt = Date.now();
    this.request.outgoing = outgoing;

    return this;
  }

  public extendForwarded(forwarded: Partial<NonNullable<History['forwaded']>>) {
    this.meta.updatedAt = Date.now();
    this.forwaded = Object.assign(<NonNullable<History['forwaded']>>(this.forwaded ?? {}), forwarded);

    return this;
  }

  public toPlain(): History['TPlain'] {
    return {
      id: this.id,
      meta: this.meta,

      request: this.request,
      forwaded: this.forwaded,

      error: this.error,
      expectation: this.expectation?.toPlain(),
    };
  }

  static build(request: History['request']) {
    return new History(request);
  }
}
