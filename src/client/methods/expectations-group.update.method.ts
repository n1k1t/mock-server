import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: TEndpoints['updateExpectationsGroup']['incoming']['data'];
    outgoing: TEndpoints['updateExpectationsGroup']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['updateExpectationsGroup']['outgoing']>({
        data: body,

        ...cast<TEndpoints['updateExpectationsGroup']['location']>({
          url: `${config.get('routes').internal.root}/expectations/group`,
          method: 'PUT',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  })
  .register('onsite', (provider) => async (body) =>
    [...provider.storages.expectations.values()].map((expectation) => {
      expectation.isEnabled = body.set.isEnabled;

      const plain = expectation.toPlain();

      provider.exchanges.io.publish('expectation:updated', plain);
      return plain;
    })
  );
