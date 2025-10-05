import { v4 as genUid } from 'uuid';
import _ from 'lodash';

import type { IRequestContextMessage, RequestContextSnapshot } from '../../models';
import type { IHistoryMeta, THistoryStatus } from './types';
import type { Expectation } from '../../../expectations';

import { buildCounter } from '../../../utils';

export class History {
  public TPlain!: Pick<History, 'id' | 'status' | 'group' | 'timestamp' | 'meta'> & {
    format: 'plain';

    snapshot: RequestContextSnapshot['TPlain'];
    expectation?: Expectation<any>['TPlain'];
  };

  public TCompact!: Omit<History['TPlain'], 'snapshot' | 'expectation' | 'format'> & {
    format: 'compact';
    expectation?: Expectation<any>['TCompact'];
  };

  public id: string = this.configuration.id ?? genUid();
  public timestamp: number = this.configuration.timestamp ?? Date.now();

  public group: string = this.configuration.group;
  public snapshot: RequestContextSnapshot = this.configuration.snapshot;

  public status: THistoryStatus = this.configuration.status ?? 'unregistered';
  public meta: IHistoryMeta = this.configuration.meta ?? {
    tags: {
      transport: this.snapshot.transport,

      incoming: {
        path: this.snapshot.incoming.path,
        method: this.snapshot.incoming.method,
      },

      outgoing: {
        status: this.snapshot.outgoing.status,
      },
    },

    metrics: {
      duration: 0,
    },
  };

  public messagesCounter = buildCounter();
  public expectation?: Expectation<any> = this.configuration.expectation;

  constructor(
    protected configuration:
      & Pick<History, 'group' | 'snapshot'>
      & Partial<Pick<History, 'timestamp' | 'id' | 'status' | 'expectation' | 'meta'>>
  ) {}

  public pushMessage(location: IRequestContextMessage['location'], data: unknown): this {
    this.snapshot.messages.push({ location, data, id: this.messagesCounter(), timestamp: Date.now() });
    return this.mark();
  }

  /** Actualizes internal snapshot with provided */
  public actualize(snapshot: RequestContextSnapshot): this {
    this.snapshot.assign(snapshot.omit(['incoming', 'forwarded', 'messages']));

    if (snapshot.forwarded) {
      this.snapshot.assign({
        forwarded: {
          incoming: _.omit(snapshot.forwarded.incoming, ['stream']),

          ...(snapshot.forwarded.outgoing && {
            outgoing: _.omit(snapshot.forwarded.outgoing, ['stream']),
          }),
        },
      });
    }

    if (snapshot.seed !== undefined) {
      this.meta.tags.seed = snapshot.seed;
    }

    return this.mark();
  }

  /** Switched status and updates duration */
  public switch(status: History['status']): this {
    return Object.assign(this.mark(), { status });
  }

  public is(status: History['status']): boolean {
    return this.status === status;
  }

  public complete(): this {
    if (this.snapshot.container) {
      this.snapshot.container = this.snapshot.container.clone();
    }

    if (this.snapshot.cache.hasRead || this.snapshot.cache.hasWritten) {
      this.meta.tags.cache = {
        hasWritten: this.snapshot.cache.hasWritten,
        hasRead: this.snapshot.cache.hasRead,
      };
    }

    this.meta.tags.error = this.snapshot.error;
    this.meta.tags.outgoing = {
      status: this.snapshot.outgoing.status,
    };

    return this.switch('completed');
  }

  public assign<T extends Partial<Pick<History, 'expectation'>>>(payload: T) {
    return Object.assign(this.mark(), payload);
  }

  /** Updates duration based on timestamp */
  public mark() {
    if (this.is('completed')) {
      return this;
    }

    this.meta.metrics.duration = Date.now() - this.timestamp;
    return this;
  }

  public toPlain(): History['TPlain'] {
    return {
      format: 'plain',

      id: this.id,
      timestamp: this.timestamp,

      group: this.group,
      status: this.status,

      meta: this.meta,
      snapshot: this.snapshot.toPlain(),
      expectation: this.expectation?.toPlain(),
    };
  }

  public toCompact(): History['TCompact'] {
    return {
      format: 'compact',

      id: this.id,
      timestamp: this.timestamp,

      group: this.group,
      status: this.status,

      meta: this.meta,
      expectation: this.expectation?.toCompact(),
    };
  }

  static build(configuration: History['configuration']) {
    return new History(configuration);
  }
}
