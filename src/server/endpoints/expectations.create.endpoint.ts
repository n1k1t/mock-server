import type { Expectation } from '../expectations';
import { Endpoint } from './model';

type TBody =
  & Pick<Expectation, 'delay' | 'destroy' | 'forward' | 'request' | 'response'>
  & Partial<Pick<Expectation, 'name' | 'isEnabled' | 'type'>>;

export default Endpoint
  .build<{ id: string }, { body: TBody }>()
  .bindToHttp(<const>{ method: 'POST', path: '/_mock/expectations' })
  .assignHandler(({ reply, body, expectationsStorage, webSocketExchange }) => {
    const result = expectationsStorage.register(body);
    if (result.status === 'ERROR') {
      return reply.validationError(result.reasons);
    }

    webSocketExchange?.publish('expectation:added', result.expectation);
    reply.ok({ id: result.expectation.id });
  });
