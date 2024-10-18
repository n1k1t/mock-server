import _ from 'lodash';
import rfdc from 'rfdc';

import { introspectExpectationSchema } from '../../../server/expectations';
import { IOverridedExpectationSegment } from './types';

const clone = rfdc();

export const convertToExpectationBody = <T extends IOverridedExpectationSegment>(body: T): object => {
  const result = clone(body);

  introspectExpectationSchema(result.request ?? {}, (key, segment) => {
    if (key === '$exec') {
      _.set(segment, key, segment.$exec?.toString());
    }
  });

  introspectExpectationSchema(result.response ?? {}, (key, segment) => {
    if (key === '$exec') {
      _.set(segment, key, segment.$exec?.toString());
    }
  });

  return result;
}
