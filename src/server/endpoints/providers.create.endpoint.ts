import { Endpoint, Provider } from '../models';

export default Endpoint
  .build<{
    incoming: {
      data: {
        group: string;

        /** Seconds */
        ttl?: number;
        route?: string;
      };
    };

    outgoing: null;
  }>()
  .bindToHttp(<const>{ method: 'POST', path: '/providers' })
  .assignHandler(async ({ reply, incoming, server }) => {
    if (!incoming.data?.group) {
      return reply.validationError(['Parameter "group" is not valid']);
    }

    const provider = server.providers.get(incoming.data.group) ?? Provider.build({
      group: incoming.data.group,
      ttl: incoming.data.ttl,
    });

    incoming.data?.route
      ? server.router.register(incoming.data.route, { provider })
      : server.providers.register(provider);

    reply.ok(null);
  });
