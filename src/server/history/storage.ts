import { HistoryRecord } from './model';
import { serverConfig } from '../../config';
import { IRequestPlainContext } from '../models';

export class HistoryStorage extends Map<string, HistoryRecord> {
  private idsStack: string[] = [];

  public register(requestContext: IRequestPlainContext): HistoryRecord {
    const historyRecord = HistoryRecord.build(requestContext);

    this.set(historyRecord.id, historyRecord);

    if (this.idsStack.push(historyRecord.id) > serverConfig.historyRecordsLimit) {
      this.delete(this.idsStack.shift()!);
    }

    return historyRecord;
  }
}
