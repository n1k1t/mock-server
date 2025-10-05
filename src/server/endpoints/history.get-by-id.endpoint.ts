import { Endpoint, History } from '../models';

export default Endpoint
  .build<{
    incoming: {
      query: { id: string };
      data: { id: string };
    };

    outgoing: History['TPlain'];
  }>()
  .bindToHttp(<const>{ method: 'GET', path: '/history' })
  .bindToIo(<const>{ path: 'history:get-by-id' })
  .assignHandler(({ reply, incoming, server }) => {
    const id = incoming.data?.id ?? incoming.query?.id;
    if (!id) {
      return reply.validationError(['Invalid "id" query parameter']);
    }

    for (const provider of server.providers.extract()) {
      const history = provider.storages.history.get(id);
      if (history) {
        return reply.ok(history.toPlain());
      }
    }

    return reply.notFound();
  });
