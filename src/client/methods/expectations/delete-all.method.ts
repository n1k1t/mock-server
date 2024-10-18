import { buildClientMethod, handleRequestError } from '../../utils';
import { deleteAllExpectations } from '../../../server/endpoints';

export default buildClientMethod((instance) => () =>
  instance
    .request({
      url: deleteAllExpectations.http.path,
      method: deleteAllExpectations.http.method,
    })
    .catch(handleRequestError)
);
