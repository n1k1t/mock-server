import { History } from './model';
import config from '../../../config';

export class HistoryStorage extends Map<string, History> {
  private stack: string[] = [];

  constructor(private configuration: Pick<History, 'group'>) {
    super();
  }

  public register(predicate: History | Omit<History['configuration'], 'group'>): History {
    const history = predicate instanceof History ? predicate : History.build({
      group: this.configuration.group,
      snapshot: predicate.snapshot,
    });

    this.set(history.id, history);

    if (this.stack.push(history.id) > config.get('history').limit) {
      this.delete(this.stack.shift()!);
    }

    return history.switchStatus('registred');
  }

  public unregister(history?: History): this {
    if (history) {
      this.delete(history.switchStatus('unregistred').id);
    }

    return this;
  }
}
