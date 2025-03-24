import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<{
    incoming: {
      data: {
        id: string;
        set: Partial<Expectation<any>['configuration']>;
      };
    };

    outgoing: Expectation['TPlain'];
  }>()
  .bindToHttp(<const>{ method: 'PUT', path: '/expectations' })
  .bindToIo(<const>{ path: 'expectations:update' })
  .assignHandler(async ({ reply, incoming, server }) => {
    if (!incoming.data) {
      return reply.validationError();
    }

    const provider = server.providers.extract().find((provider) => provider.storages.expectations.has(incoming.data!.id));
    if (!provider) {
      return reply.notFound();
    }

    const updated = await provider.client.updateExpectation(incoming.data);
    updated ? reply.ok(updated) : reply.notFound();
  });
