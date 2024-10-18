export interface IHistoryRecordMeta {
  state: 'pending' | 'finished';
  requestedAt: number;
  updatedAt: number;
}
