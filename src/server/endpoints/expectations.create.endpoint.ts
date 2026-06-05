import { EndpointFactory } from '../models';
import { Expectation } from '../../expectations';

export default EndpointFactory
  .build<{
    incoming: { data: Expectation['configuration'] };
    outgoing: Expectation['TPlain'];
  }>()
  .http(<const>{ method: 'POST', path: '/expectations' })
  .compile(async ({ reply, incoming, server }) => {
    if (!incoming.data) {
      return reply.validationError();
    }

    const group = incoming.data.group ?? 'default';
    const provider = group === 'default' ? server.providers.default : server.providers.get(group);

    if (!provider) {
      return reply.notFound();
    }

    reply.ok(await provider.client.createExpectation(incoming.data))
  });
