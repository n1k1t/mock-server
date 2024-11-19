import { handleRequestError, prepareExpectationBodyToRequest } from '../utils';
import { ValidationError } from '../errors';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

export default ClientMethod
  .build<TEndpoints['createExpectation']['result'], TEndpoints['createExpectation']['body']>()
  .provide('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['createExpectation']['response']>({
        data: prepareExpectationBodyToRequest(body),

        ...cast<TEndpoints['createExpectation']['location']>({
          url: '/_mock/expectations',
          method: 'POST',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  })
  .provide('onsite', (context) => async (body) => {
    const result = context.storage.expectations.register(body);
    if (result.status === 'ERROR') {
      throw new ValidationError({}, result.reasons);
    }

    context.exchange.ws.publish('expectation:added', result.expectation.toPlain());
    return result.expectation.toPlain();
  });
