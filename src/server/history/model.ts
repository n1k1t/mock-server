import { v4 as genUid } from 'uuid';

import type { IHistoryMeta, IHistoryRequest } from './types';
import type { HttpRequestContext } from '../models';
import type { Expectation } from '../../expectations';

export class History {
  public TPlain!: Pick<History, 'id' | 'forwaded' | 'meta' | 'request'> & {
    expectation?: Expectation<any>['TPlain'];
  }

  public id: string = genUid();

  public expectation?: Expectation<any>;
  public forwaded?: Pick<HttpRequestContext['TPlain'], 'incoming' | 'outgoing'>;

  public meta: IHistoryMeta = {
    state: 'pending',

    requestedAt: Date.now(),
    updatedAt: Date.now(),
  };

  constructor(public request: IHistoryRequest) {}

  public switchState(state: IHistoryMeta['state']): this {
    this.meta.updatedAt = Date.now();
    this.meta.state = state;

    return this;
  }

  public assignExpectation(expectation: NonNullable<History['expectation']>): this {
    this.meta.updatedAt = Date.now();
    return Object.assign(this, { expectation });
  }

  public assignError(error: NonNullable<IHistoryRequest['error']>): this {
    this.meta.updatedAt = Date.now();
    this.request.error = error;

    return this;
  }

  public assignOutgoing(outgoing: NonNullable<HttpRequestContext['outgoing']>): this {
    this.meta.updatedAt = Date.now();
    this.request.outgoing = outgoing;

    return this;
  }

  public extendForwarded(forwarded: Partial<NonNullable<History['forwaded']>>): this {
    this.meta.updatedAt = Date.now();

    return Object.assign(this, {
      forwarded: Object.assign(<NonNullable<History['forwaded']>>(this.forwaded ?? {}), forwarded)
    });
  }

  public toPlain(): History['TPlain'] {
    return {
      id: this.id,
      meta: this.meta,

      request: this.request,
      forwaded: this.forwaded,

      expectation: this.expectation?.toPlain(),
    };
  }

  static build(request: History['request']) {
    return new History(request);
  }
}
