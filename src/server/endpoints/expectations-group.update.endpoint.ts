import { EndpointFactory } from '../models';
import { Expectation } from '../../expectations';

export default EndpointFactory
  .build<{
    incoming: {
      data: {
        name?: string;
        set: {
          isEnabled: boolean;
        };
      };
    };

    outgoing: Expectation['TPlain'][];
  }>()
  .http(<const>{ method: 'PUT', path: '/expectations/group' })
  .io(<const>{ path: 'expectations:group:update' })
  .compile(async ({ reply, incoming, server }) => {
    if (!incoming.data) {
      return reply.validationError();
    }

    const group = incoming.data.name ?? 'default';
    const provider = group === 'default' ? server.providers.default : server.providers.get(group);

    if (!provider) {
      return reply.notFound();
    }

    reply.ok(await provider.client.updateExpectationsGroup(incoming.data.set));
  });
