import { Provider, RequestContextSnapshot } from '../../models';
import { Expectation } from '../../../expectations';
import { History } from './model';

import config from '../../../config';

export class HistoryStorage extends Map<string, History> {
  private stack: string[] = [];

  constructor(protected configuration: Pick<History, 'group'> & { limit?: number }) {
    super();
  }

  /** Extends this storage with another */
  public extend(storage: HistoryStorage): this {
    for (const [name, history] of storage.entries()) {
      this.set(name, history);
    }

    return this;
  }

  /** Registers history item */
  public register(predicate: History | Omit<History['configuration'], 'group'>): History {
    const history = predicate instanceof History ? predicate : History.build({
      status: 'registered',

      group: this.configuration.group,
      snapshot: predicate.snapshot,
    });

    this.set(history.id, history);

    if (this.stack.push(history.id) > (this.configuration.limit ?? config.get('history').limit)) {
      this.delete(this.stack.shift()!);
    }

    return history;
  }

  /** Removes history item from storage and marks it as `unregistred` */
  public unregister(history?: History): this {
    if (history) {
      this.delete(history.switch('unregistered').id);
      this.stack.splice(this.stack.indexOf(history.id), 1);
    }

    return this;
  }

  /** Clears storage */
  public clear(): void {
    this.stack = [];
    super.clear();
  }
}
