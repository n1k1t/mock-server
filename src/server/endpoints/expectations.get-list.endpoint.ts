import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: Expectation['TPlain'][] }>()
  .bindToHttp(<const>{ method: 'GET', path: '/expectations' })
  .bindToIo(<const>{ path: 'expectations:get-list' })
  .assignHandler(({ reply, server }) => {
    const expectations = [...server.providers.values()].reduce<Expectation[]>(
      (acc, provider) => acc.concat([...provider.storages.expectations.values()]),
      []
    );

    reply.ok(expectations.map((expectation) => expectation.toPlain()));
  })
  .compile();
