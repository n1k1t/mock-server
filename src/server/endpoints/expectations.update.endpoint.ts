import { EndpointFactory } from '../models';
import { Expectation } from '../../expectations';

export default EndpointFactory
  .build<{
    incoming: {
      data: {
        id: string;
        set: Partial<Expectation['configuration']>;
      };
    };

    outgoing: Expectation['TPlain'];
  }>()
  .http(<const>{ method: 'PUT', path: '/expectations' })
  .io(<const>{ path: 'expectations:update' })
  .compile(async ({ reply, incoming, server }) => {
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
