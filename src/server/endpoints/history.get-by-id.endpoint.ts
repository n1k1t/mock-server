import { EndpointFactory, History } from '../models';

export default EndpointFactory
  .build<{
    incoming: {
      query: { id: string };
      data: { id: string };
    };

    outgoing: History['TPlain'];
  }>()
  .http(<const>{ method: 'GET', path: '/history' })
  .io(<const>{ path: 'history:get-by-id' })
  .compile(({ reply, incoming, server }) => {
    const id = incoming.data?.id ?? incoming.query.id;
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
