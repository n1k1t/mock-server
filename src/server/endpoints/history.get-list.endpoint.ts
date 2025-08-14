import { History, Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: History['TPlain'][] }>()
  .bindToHttp(<const>{ method: 'GET', path: '/history' })
  .bindToIo(<const>{ path: 'history:get-list' })
  .assignHandler(({ reply, server }) =>
    reply.ok(
      server.providers
        .extract()
        .reduce<History[]>((acc, provider) => acc.concat([...provider.storages.history.values()]), [])
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((history) => history.plain)
    )
  );
