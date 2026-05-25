import { EndpointFactory } from '../models';
import { Expectation } from '../../expectations';

export default EndpointFactory
  .build<{ outgoing: Expectation['TCompact'][] }>()
  .http(<const>{ method: 'GET', path: '/expectations/compact' })
  .io(<const>{ path: 'expectations:compact:get-list' })
  .compile(({ reply, server }) =>
    reply.ok(
      server.providers
        .extract()
        .reduce<Expectation[]>((acc, provider) => acc.concat([...provider.storages.expectations.values()]), [])
        .map((expectation) => expectation.toCompact())
    )
  );
