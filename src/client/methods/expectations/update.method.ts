import { buildClientMethod, handleRequestError } from '../../utils';
import { updateExpectation } from '../../../server/endpoints';
import { IOverridedExpectationSegment } from './types';
import { convertToExpectationBody } from './utils';

type TBody = Omit<typeof updateExpectation['TParameters']['body'], 'set'> & {
  set: Omit<typeof updateExpectation['TParameters']['body']['set'], 'request' | 'response'> & IOverridedExpectationSegment;
}

export default buildClientMethod((instance) => (body: TBody) =>
  instance
    .request({
      url: updateExpectation.http.path,
      method: updateExpectation.http.method,

      data: {
        id: body.id,
        body: convertToExpectationBody(body.set),
      },
    })
    .catch(handleRequestError)
);
