import merge from 'deepmerge';

import { Expectation } from '../expectations';
import { Endpoint } from './model';

type TBody = Partial<Pick<Expectation, 'delay' | 'destroy' | 'forward' | 'request' | 'response' | 'isEnabled'>>;

export default Endpoint
  .build<Expectation, { body: { id: string, set: TBody } }>()
  .bindToHttp(<const>{ method: 'PUT', path: '/_mock/expectations' })
  .bindToWebSocket(<const>{ path: 'expectations:update' })
  .assignHandler(({ reply, body, expectationsStorage, webSocketExchange }) => {
    const expectation = expectationsStorage.get(body.id);

    if (!expectation) {
      return reply.notFound();
    }

    const updatedExpectation = Expectation.build(expectation.type, merge(expectation, body.set ?? {}));
    const errors = updatedExpectation.validate();

    if (errors.length) {
      return reply.validationError(errors);
    }

    expectationsStorage.set(body.id, updatedExpectation);

    webSocketExchange?.publish('expectation:updated', updatedExpectation);
    reply.ok(updatedExpectation);
  });
