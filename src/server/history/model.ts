import { v4 as genUid } from 'uuid';

import type { RequestContextSnapshot } from '../models';
import type { SetPartialKeys } from '../../types';
import type { Expectation } from '../../expectations';

import { cast } from '../../utils';

export class History {
  public TPlain!: Pick<History, 'id' | 'status' | 'meta'> & {
    snapshot: RequestContextSnapshot['TPlain'];
    expectation?: Expectation<any>['TPlain'];
  };

  public id: string = genUid();

  public status = cast<'pending' | 'finished'>('pending');
  public expectation?: Expectation<any>;

  public meta = {
    requestedAt: Date.now(),
    updatedAt: Date.now(),
  };

  constructor(public snapshot: SetPartialKeys<RequestContextSnapshot, 'outgoing'>) {}

  public switchStatus(status: History['status']): this {
    this.meta.updatedAt = Date.now();
    this.status = status;

    if (status === 'finished' && this.snapshot.container) {
      this.snapshot.container = this.snapshot.container.clone();
    }

    return this;
  }

  public assignExpectation(expectation: NonNullable<History['expectation']>): this {
    this.meta.updatedAt = Date.now();
    return Object.assign(this, { expectation });
  }

  public toPlain(): History['TPlain'] {
    return {
      id: this.id,
      meta: this.meta,
      status: this.status,

      snapshot: this.snapshot.toPlain(),
      expectation: this.expectation?.toPlain(),
    };
  }

  static build(request: History['snapshot']) {
    return new History(request);
  }
}
