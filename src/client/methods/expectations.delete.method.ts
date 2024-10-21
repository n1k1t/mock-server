import { handleRequestError } from '../utils';
import { ClientMethod } from '../models';
import { TEndpoints } from '../types';
import { cast } from '../../utils';

export default ClientMethod
  .build<TEndpoints['deleteExpectation']['result'], TEndpoints['deleteExpectation']['body']>()
  .provide('remote', (instance) => async (body) => {
    await instance
      .request<TEndpoints['deleteExpectation']['response']>({
        data: body,

        ...cast<TEndpoints['deleteExpectation']['location']>({
          url: '/_mock/expectations',
          method: 'DELETE',
        }),
      })
      .catch(handleRequestError);

    return null;
  })
  .provide('onsite', (context) => async (body) => {
    body?.ids
      ? body.ids.forEach((id) => context.storage.expectations.delete(id))
      : context.storage.expectations.clear();

    return null;
  });
