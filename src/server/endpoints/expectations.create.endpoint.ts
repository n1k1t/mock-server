import { Expectation, TBuildExpectationConfiguration } from '../../expectations';
import { Endpoint } from '../models';

export default Endpoint
  .build<Expectation['TPlain'], { body: TBuildExpectationConfiguration<any> }>()
  .bindToHttp(<const>{ method: 'POST', path: '/_mock/expectations' })
  .assignHandler(async ({ reply, incoming, server }) => {
    reply.ok(await server.client.createExpectation(incoming.body));
  });
