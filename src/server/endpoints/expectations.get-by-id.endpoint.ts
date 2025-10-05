import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<{
    incoming: {
      query: { id: string };
      data: { id: string };
    };

    outgoing: Expectation['TPlain'];
  }>()
  .bindToHttp(<const>{ method: 'GET', path: '/expectations' })
  .bindToIo(<const>{ path: 'expectations:get-by-id' })
  .assignHandler(({ reply, incoming, server }) => {
    const id = incoming.data?.id ?? incoming.query?.id;
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
