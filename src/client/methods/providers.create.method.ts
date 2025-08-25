import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: TEndpoints['providersCreate']['incoming']['data'];
    outgoing: TEndpoints['providersCreate']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async (body) => {
    const response = await instance
      .request<TEndpoints['providersCreate']['outgoing']>({
        data: body,

        ...cast<TEndpoints['providersCreate']['location']>({
          url: `${config.get('routes').internal.root}/providers`,
          method: 'POST',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  });
