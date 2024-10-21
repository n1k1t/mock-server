import { v4 as genUid } from 'uuid';

import { Expectation } from '../../expectations';
import { IRequestPlainContext, IResponsePlainContext } from '../models';
import { IHistoryRecordMeta } from './types';

export class HistoryRecord {
  public id: string = genUid();

  public expectation?: Expectation;
  public response?: IResponsePlainContext;

  public forwaded?: {
    request: IRequestPlainContext;

    response?: IResponsePlainContext;
    curl?: string;
  };

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

  constructor(public request: IRequestPlainContext) {}

  public changeState(state: IHistoryRecordMeta['state']): this {
    Object.assign(this.meta, { state, updatedAt: Date.now() });
    return this;
  }

  public assign<T extends Partial<Omit<HistoryRecord, 'id' | 'request' | 'meta'>>>(context: T) {
    Object.assign(this.meta, { updatedAt: Date.now() });
    return Object.assign(this, context);
  }

  public extendForwarded(
    this: SetRequiredKeys<this, 'forwaded'>,
    forwarded: Partial<NonNullable<this['forwaded']>>,
  ): this {
    Object.assign(this.meta, { updatedAt: Date.now() });
    Object.assign(this.forwaded!, forwarded);

    return this;
  }

  static build(request: IRequestPlainContext) {
    return new HistoryRecord(request);
  }
}
