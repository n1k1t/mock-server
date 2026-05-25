import { EndpointFactory } from '../models';

export default EndpointFactory
  .build<{
    incoming: {
      data: {
        group: string;
      };
    };

    outgoing: null;
  }>()
  .http(<const>{ method: 'DELETE', path: '/providers' })
  .compile(async ({ reply, incoming, server }) => {
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
