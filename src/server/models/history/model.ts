import { v4 as genUid } from 'uuid';

import type { IRequestContextMessage, RequestContextSnapshot } from '../../models';
import type { THistoryStatus } from './types';
import type { Expectation } from '../../../expectations';

import { buildCounter } from '../../../utils';

export class History {
  public TPlain!: Pick<History, 'id' | 'status' | 'group' | 'timestamp' | 'duration'> & {
    snapshot: RequestContextSnapshot['TPlain'];
    expectation?: Expectation<any>['TPlain'];
  };

  public id: string = this.configuration.id ?? genUid();
  public messagesCounter = buildCounter();

  public group: string = this.configuration.group;
  public snapshot: RequestContextSnapshot = this.configuration.snapshot;

  public status: THistoryStatus = this.configuration.status ?? 'unregistered';
  public expectation?: Expectation<any> = this.configuration.expectation;

  public timestamp: number = this.configuration.timestamp ?? Date.now();
  public duration: number = this.configuration.duration ?? 0;

  private cached: null | History['TPlain'] = null;

  constructor(
    protected configuration:
      & Pick<History, 'group' | 'snapshot'>
      & Partial<Pick<History, 'timestamp' | 'id' | 'status' | 'expectation' | 'duration'>>
  ) {}

  public get plain(): History['TPlain'] {
    return this.cached ?? this.toPlain();
  }

  public pushMessage(location: IRequestContextMessage['location'], data: unknown): this {
    this.snapshot.messages.push({ location, data, id: this.messagesCounter(), timestamp: Date.now() });
    return this.mark();
  }

  public actualizeSnapshot(snapshot: RequestContextSnapshot): this {
    this.snapshot.assign(snapshot.omit(['incoming', 'forwarded', 'messages']));
    return this.mark();
  }

  public switchStatus(status: History['status']): this {
    return Object.assign(this.mark(), { status });
  }

  public hasStatus(status: History['status']): boolean {
    return this.status === status;
  }

  public complete(): this {
    if (this.snapshot.container) {
      this.snapshot.container = this.snapshot.container.clone();
    }

    this.cached = this.switchStatus('completed').toPlain();
    return this;
  }

  public assign<T extends Partial<Pick<History, 'expectation'>>>(payload: T) {
    return Object.assign(this.mark(), payload);
  }

  /** Updates duration property base on timestamp */
  public mark() {
    return this.hasStatus('completed')
      ? this
      : Object.assign(this, { duration: Date.now() - this.timestamp });
  }

  public toPlain(): History['TPlain'] {
    return {
      id: this.id,

      timestamp: this.timestamp,
      duration: this.duration,

      group: this.group,
      status: this.status,

      snapshot: this.snapshot.toPlain(),
      expectation: this.expectation?.toPlain(),
    };
  }

  static build(configuration: History['configuration']) {
    return new History(configuration);
  }
}
