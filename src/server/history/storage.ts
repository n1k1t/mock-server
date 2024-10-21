import { IRequestPlainContext } from '../models';
import { HistoryRecord } from './model';

import config from '../../config';

export class HistoryStorage extends Map<string, HistoryRecord> {
  private idsStack: string[] = [];

  public register(requestContext: IRequestPlainContext): HistoryRecord {
    const historyRecord = HistoryRecord.build(requestContext);

    this.set(historyRecord.id, historyRecord);

    if (this.idsStack.push(historyRecord.id) > config.server.historyRecordsLimit) {
      this.delete(this.idsStack.shift()!);
    }

    return historyRecord;
  }
}
