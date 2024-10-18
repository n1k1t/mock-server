import type { HistoryRecord } from '../history';
import { Endpoint } from './model';

export default Endpoint
  .build<HistoryRecord[]>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/history' })
  .bindToWebSocket(<const>{ path: 'history:get' })
  .assignHandler(({ reply, historyStorage }) =>
    reply.ok(
      [...historyStorage.values()]
        .sort((a, b) => a.meta.requestedAt - b.meta.requestedAt)
        .reverse()
    )
  );
