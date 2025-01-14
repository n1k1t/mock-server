import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: TEndpoints['deleteExpectation']['incoming']['data'];
    outgoing: TEndpoints['deleteExpectation']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async (body) => {
    await instance
      .request<TEndpoints['deleteExpectation']['outgoing']>({
        data: body,

        ...cast<TEndpoints['deleteExpectation']['location']>({
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
