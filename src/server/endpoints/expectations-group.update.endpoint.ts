import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
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
  .bindToHttp(<const>{ method: 'PUT', path: '/expectations/group' })
  .bindToIo(<const>{ path: 'expectations:group:update' })
  .assignHandler(async ({ reply, incoming, server }) => {
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
