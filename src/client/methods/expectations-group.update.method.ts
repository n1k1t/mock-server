import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: NonNullable<TEndpoints['expectationsGroupUpdate']['incoming']['data']>;
    outgoing: TEndpoints['expectationsGroupUpdate']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['expectationsGroupUpdate']['outgoing']>({
        data: body,

        ...cast<TEndpoints['expectationsGroupUpdate']['location']>({
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

      provider.server?.exchanges.io.publish('expectation:updated', plain);
      return plain;
    })
  );
