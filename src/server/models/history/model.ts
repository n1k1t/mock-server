import { v4 as genUid } from 'uuid';

import type { IRequestContextMessage, RequestContextSnapshot } from '../../models';
import type { SetRequiredKeys } from '../../../types';
import type { Expectation } from '../../../expectations';

import { buildCounter, cast } from '../../../utils';

export class History {
  public TPlain!: Pick<History, 'id' | 'status' | 'meta' | 'group'> & {
    snapshot: RequestContextSnapshot['TPlain'];
    expectation?: Expectation<any>['TPlain'];
  };

  public id: string = genUid();
  public messagesCounter = buildCounter();

  public group: string = this.configuration.group;
  public snapshot: SetRequiredKeys<RequestContextSnapshot, 'messages'> = this.configuration.snapshot;

  public status = cast<'unregistred' | 'registred' | 'pending' | 'completed'>('unregistred');
  public expectation?: Expectation<any>;

  public meta = {
    requestedAt: Date.now(),
    updatedAt: Date.now(),
  };

  constructor(private configuration: Pick<History, 'group' | 'snapshot'>) {}

  public pushMessage(location: IRequestContextMessage['location'], data: unknown): this {
    this.snapshot.messages.push({ location, data, id: this.messagesCounter(), timestamp: Date.now() });
    return this;
  }

  public actualizeSnapshot(snapshot: RequestContextSnapshot): this {
    this.snapshot.assign(snapshot.omit(['incoming', 'forwarded', 'messages']));
    return this;
  }

  public switchStatus(status: History['status']): this {
    this.meta.updatedAt = Date.now();
    this.status = status;

    return this;
  }

  public hasStatus(status: History['status']): boolean {
    return this.status === status;
  }

  public complete(): this {
    this.meta.updatedAt = Date.now();
    this.status = 'completed';

    if (this.snapshot.container) {
      this.snapshot.container = this.snapshot.container.clone();
    }

    return this;
  }

  public assign<T extends Partial<Pick<History, 'expectation'>>>(payload: T) {
    this.meta.updatedAt = Date.now();
    return Object.assign(this, payload);
  }

  public toPlain(): History['TPlain'] {
    return {
      id: this.id,
      group: this.group,

      meta: this.meta,
      status: this.status,

      snapshot: this.snapshot.toPlain(),
      expectation: this.expectation?.toPlain(),
    };
  }

  static build(configuration: History['configuration']) {
    return new History(configuration);
  }
}
