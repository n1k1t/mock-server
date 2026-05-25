import { History, EndpointFactory } from '../models';

export default EndpointFactory
  .build<{ outgoing: History['TCompact'][] }>()
  .http(<const>{ method: 'GET', path: '/history/compact' })
  .io(<const>{ path: 'history:compact:get-list' })
  .compile(({ reply, server }) =>
    reply.ok(
      server.providers
        .extract()
        .reduce<History[]>((acc, provider) => acc.concat([...provider.storages.history.values()]), [])
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((history) => history.toCompact())
    )
  );
