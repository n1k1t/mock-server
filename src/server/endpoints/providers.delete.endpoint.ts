import { Endpoint } from '../models';

export default Endpoint
  .build<{
    incoming: {
      data: {
        group: string;
      };
    };

    outgoing: null;
  }>()
  .bindToHttp(<const>{ method: 'DELETE', path: '/providers' })
  .assignHandler(async ({ reply, incoming, server }) => {
    if (!incoming.data?.group) {
      return reply.validationError(['Parameter "group" is not valid']);
    }

    const provider = server.providers.get(incoming.data.group);
    if (!provider) {
      return reply.notFound();
    }

    server.providers.unregister(provider);
    server.router.unregister(provider);

    reply.ok(null);
  });
