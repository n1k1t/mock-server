import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<{
    incoming: { data: Expectation<any>['configuration'] };
    outgoing: Expectation['TPlain'];
  }>()
  .bindToHttp(<const>{ method: 'POST', path: '/expectations' })
  .assignHandler(async ({ reply, incoming, server }) => {
    if (!incoming.data) {
      return reply.validationError();
    }

    const group = incoming.data.group ?? 'default';
    const provider = group === 'default' ? server.providers.default : server.providers.get(group);

    if (!provider) {
      return reply.notFound();
    }

    reply.ok(await provider.client.createExpectation(incoming.data))
  })
  .compile();
