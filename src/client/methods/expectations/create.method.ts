import { buildClientMethod, handleRequestError } from '../../utils';
import { IOverridedExpectationSegment } from './types';
import { createExpectation } from '../../../server/endpoints';
import { convertToExpectationBody } from './utils';

type TBody = Omit<typeof createExpectation['TParameters']['body'], 'request' | 'response'> & IOverridedExpectationSegment;

export default buildClientMethod((instance) => (body: TBody) =>
  instance
    .request({
      url: createExpectation.http.path,
      method: createExpectation.http.method,

      data: convertToExpectationBody(body),
    })
    .catch(handleRequestError)
);
