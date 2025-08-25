import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: TEndpoints['providersDelete']['incoming']['data'];
    outgoing: TEndpoints['providersDelete']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['providersDelete']['outgoing']>({
        data: body,

        ...cast<TEndpoints['providersDelete']['location']>({
          url: `${config.get('routes').internal.root}/providers`,
          method: 'DELETE',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  });
