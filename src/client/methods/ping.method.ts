import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

export default ClientMethod
  .build<TEndpoints['ping']['result'], TEndpoints['ping']['body']>()
  .provide('remote', (instance) => async () => {
    const response = await instance
      .request<TEndpoints['ping']['response']>({
        ...cast<TEndpoints['ping']['location']>({
          url: '/_mock/ping',
          method: 'GET',
        }),
      })
      .catch(handleRequestError);

    return response.data.data;
  })
  .provide('onsite', (context) => async () => {
    return 'pong';
  });
