import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

import config from '../../config';

export default ClientMethod
  .build<{
    incoming: void;
    outgoing: TEndpoints['ping']['outgoing']['data'];
  }>()
  .register('remote', (instance) => async () => {
    const response = await instance
      .request<TEndpoints['ping']['outgoing']>({
        ...cast<TEndpoints['ping']['location']>({
          url: `${config.get('routes').internal.root}/ping`,
          method: 'GET',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  })
  .register('onsite', () => async () => 'pong');
