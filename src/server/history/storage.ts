import config from '../../config';
import { History } from './model';

export class HistoryStorage extends Map<string, History> {
  private ids: string[] = [];

  public register(request: History['snapshot']): History {
    const history = History.build(request);
    this.set(history.id, history);

    if (this.ids.push(history.id) > config.get('history').limit) {
      this.delete(this.ids.shift()!);
    }

    return history;
  }
}
