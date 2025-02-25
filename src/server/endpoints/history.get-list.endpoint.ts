import { History, Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: History['TPlain'][] }>()
  .bindToHttp(<const>{ method: 'GET', path: '/history' })
  .bindToIo(<const>{ path: 'history:get-list' })
  .assignHandler(({ reply, server }) => {
    const history = [...server.providers.values()].reduce<History[]>(
      (acc, provider) => acc.concat([...provider.storages.history.values()]),
      []
    );

    reply.ok(history.sort((a, b) => b.timestamp - a.timestamp).map((history) => history.toPlain()));
  })
  .compile();
