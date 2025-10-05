import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: Expectation['TCompact'][] }>()
  .bindToHttp(<const>{ method: 'GET', path: '/expectations/compact' })
  .bindToIo(<const>{ path: 'expectations:compact:get-list' })
  .assignHandler(({ reply, server }) =>
    reply.ok(
      server.providers
        .extract()
        .reduce<Expectation[]>((acc, provider) => acc.concat([...provider.storages.expectations.values()]), [])
        .map((expectation) => expectation.toCompact())
    )
  );
