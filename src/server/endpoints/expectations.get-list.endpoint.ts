import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: Expectation['TPlain'][] }>()
  .bindToHttp(<const>{ method: 'GET', path: '/expectations' })
  .bindToIo(<const>{ path: 'expectations:get-list' })
  .assignHandler(({ reply, server }) =>
    reply.ok(
      [...server.providers.values()]
        .reduce<Expectation[]>((acc, provider) => acc.concat([...provider.storages.expectations.values()]), [])
        .map((expectation) => expectation.toPlain())
    )
  );
