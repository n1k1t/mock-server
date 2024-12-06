import { History } from '../history';
import { Endpoint } from '../models';

export default Endpoint
  .build<History['TPlain'][]>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/history' })
  .bindToWs(<const>{ path: 'history:get' })
  .assignHandler(({ reply, server }) =>
    reply.ok(
      [...server.storages.history.values()]
        .sort((a, b) => b.meta.requestedAt - a.meta.requestedAt)
        .map((history) => history.toPlain())
    )
  );
