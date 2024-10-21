import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

type TBody = Partial<Pick<Expectation, 'delay' | 'destroy' | 'forward' | 'request' | 'response' | 'isEnabled'>>;

export default Endpoint
  .build<Expectation, { body: { id: string, set: TBody } }>()
  .bindToHttp(<const>{ method: 'PUT', path: '/_mock/expectations' })
  .bindToWebSocket(<const>{ path: 'expectations:update' })
  .assignHandler(async ({ reply, body, client }) => {
    const result = await client.updateExpectation(body);

    result
      ? reply.ok(result)
      : reply.notFound();
  });
