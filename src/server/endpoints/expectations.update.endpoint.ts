import { Expectation, TBuildExpectationConfiguration } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<Expectation['TPlain'], {
    body: {
      id: string;
      set: Partial<Omit<TBuildExpectationConfiguration<any>, 'type'>>;
    };
  }>()
  .bindToHttp(<const>{ method: 'PUT', path: '/_mock/expectations' })
  .bindToWs(<const>{ path: 'expectations:update' })
  .assignHandler(async ({ reply, incoming, server }) => {
    const result = await server.client.updateExpectation(incoming.body);
    result ? reply.ok(result) : reply.notFound();
  });
