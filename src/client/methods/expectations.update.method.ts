import merge from 'deepmerge';

import { prepareExpectationBodyToRequest } from '../utils';
import { handleRequestError } from '../utils';
import { ValidationError } from '../errors';
import { ClientMethod } from '../models';
import { Expectation } from '../../expectations';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: NonNullable<TEndpoints['expectationsUpdate']['incoming']['data']>;
    outgoing: TEndpoints['expectationsUpdate']['outgoing']['data'] | null;
  }>()
  .register('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['expectationsUpdate']['outgoing']>({
        data: {
          id: body.id,
          body: prepareExpectationBodyToRequest(body.set),
        },

        ...cast<TEndpoints['expectationsUpdate']['location']>({
          url: `${config.get('routes').internal.root}/expectations`,
          method: 'PUT',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  })
  .register('onsite', (provider) => async (body) => {
    const found = provider.storages.expectations.get(body.id);
    if (!found) {
      return null;
    }

    const updated = Expectation.build(
      Object.assign(merge(found.configuration, body.set ?? {}, { arrayMerge: (target, source) => source }), {
        name: found.name,
        meta: found.meta,
        id: found.id,
      })
    );

    const errors = updated.validate();
    if (errors.length) {
      throw new ValidationError({}, errors);
    }

    provider.storages.expectations.set(body.id, updated);
    provider.server?.exchanges.io.publish('expectation:updated', updated.toPlain());

    return updated.toPlain();
  });
