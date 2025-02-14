import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: TEndpoints['expectationsDelete']['incoming']['data'];
    outgoing: TEndpoints['expectationsDelete']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async (body) => {
    await instance
      .request<TEndpoints['expectationsDelete']['outgoing']>({
        data: body,

        ...cast<TEndpoints['expectationsDelete']['location']>({
          url: `${config.get('routes').internal.root}/expectations`,
          method: 'DELETE',
        }),
      })
      .catch(handleRequestError);

    return null;
  })
  .register('onsite', (provider) => async (body) => {
    body?.ids
      ? body.ids.forEach((id) => provider.storages.expectations.delete(id))
      : provider.storages.expectations.clear();

    return null;
  });
