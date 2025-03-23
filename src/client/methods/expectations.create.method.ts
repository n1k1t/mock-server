import { handleRequestError, prepareExpectationBodyToRequest } from '../utils';
import { ValidationError } from '../errors';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: NonNullable<TEndpoints['expectationsCreate']['incoming']['data']>;
    outgoing: TEndpoints['expectationsCreate']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['expectationsCreate']['outgoing']>({
        data: prepareExpectationBodyToRequest(body),

        ...cast<TEndpoints['expectationsCreate']['location']>({
          url: `${config.get('routes').internal.root}/expectations`,
          method: 'POST',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  })
  .register('onsite', (provider) => async (body) => {
    const result = provider.storages.expectations.register(Object.assign(body, {
      group: provider.group,
    }));

    if (result.status === 'ERROR') {
      throw new ValidationError({}, result.reasons);
    }

    provider.server?.exchanges.io.publish('expectation:added', result.expectation.toPlain());
    return result.expectation.toPlain();
  });
