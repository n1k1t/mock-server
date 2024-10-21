import { Expectation } from '../../expectations';
import { Endpoint } from '../models';

type TBody =
  & Pick<Expectation, 'delay' | 'destroy' | 'forward' | 'request' | 'response'>
  & Partial<Pick<Expectation, 'name' | 'isEnabled' | 'type'>>;

export default Endpoint
  .build<{ id: string }, { body: TBody }>()
  .bindToHttp(<const>{ method: 'POST', path: '/_mock/expectations' })
  .assignHandler(async ({ reply, body, client }) => {
    const result = await client.createExpectation(body);
    reply.ok({ id: result.id });
  });
