import { EndpointFactory } from '../models';
import { Expectation } from '../../expectations';

export default EndpointFactory
  .build<{
    incoming: {
      query: { id: string };
      data: { id: string };
    };

    outgoing: Expectation['TPlain'];
  }>()
  .http(<const>{ method: 'GET', path: '/expectations' })
  .io(<const>{ path: 'expectations:get-by-id' })
  .compile(({ reply, incoming, server }) => {
    const id = incoming.data?.id ?? incoming.query.id;
    if (!id) {
      return reply.validationError(['Invalid "id" query parameter']);
    }

    for (const provider of server.providers.extract()) {
      const expectation = provider.storages.expectations.get(id);
      if (expectation) {
        return reply.ok(expectation.toPlain());
      }
    }

    return reply.notFound();
  });
