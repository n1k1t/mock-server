import { HistoryRecord } from '../history';
import { Endpoint } from '../models';

export default Endpoint
  .build<HistoryRecord[]>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/history' })
  .bindToWebSocket(<const>{ path: 'history:get' })
  .assignHandler(({ reply, storage }) =>
    reply.ok([...storage.history.values()].sort((a, b) => b.meta.requestedAt - a.meta.requestedAt))
  );
