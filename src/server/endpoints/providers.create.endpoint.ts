import { EndpointFactory, Provider } from '../models';

export default EndpointFactory
  .build<{
    incoming: {
      data: {
        group: string;

        /** Seconds */
        ttl?: number;

        /** Path match for router (`**` by default) */
        route?: string;
      };
    };

    outgoing: null;
  }>()
  .http(<const>{ method: 'POST', path: '/providers' })
  .compile(async ({ reply, incoming, server }) => {
    if (!incoming.data?.group) {
      return reply.validationError(['Parameter "group" is not valid']);
    }

    const provider = server.providers.get(incoming.data.group) ?? Provider.build({
      group: incoming.data.group,
      ttl: incoming.data.ttl,
    });

    server.router.register(incoming.data.route ?? '**', { provider })
    reply.ok(null);
  });
