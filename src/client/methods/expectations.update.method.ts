import merge from 'deepmerge';

import { prepareExpectationBodyToRequest } from '../utils';
import { handleRequestError } from '../utils';
import { ValidationError } from '../errors';
import { ClientMethod } from '../models';
import { Expectation } from '../../expectations';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

export default ClientMethod
  .build<TEndpoints['updateExpectation']['result'] | null, TEndpoints['updateExpectation']['body']>()
  .provide('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['updateExpectation']['response']>({
        data: {
          id: body.id,
          body: prepareExpectationBodyToRequest(body.set),
        },

        ...cast<TEndpoints['updateExpectation']['location']>({
          url: '/_mock/expectations',
          method: 'PUT',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  })
  .provide('onsite', (context) => async (body) => {
    const found = context.storages.expectations.get(body.id);
    if (!found) {
      return null;
    }

    const updated = Expectation.build(merge(found.toPlain(), body.set ?? {}, { arrayMerge: (target, source) => source }));

    const errors = updated.validate();
    if (errors.length) {
      throw new ValidationError({}, errors);
    }

    context.storages.expectations.set(body.id, updated);
    context.exchanges.ws.publish('expectation:updated', updated.toPlain());

    return updated.toPlain();
  });
