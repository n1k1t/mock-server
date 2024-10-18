import { buildClientMethod, handleRequestError } from '../../utils';
import { deleteExpectation } from '../../../server/endpoints';

export default buildClientMethod((instance) => (body: typeof deleteExpectation['TParameters']['body']) =>
  instance
    .request({
      url: deleteExpectation.http.path,
      method: deleteExpectation.http.method,

      data: body,
    })
    .catch(handleRequestError)
);
