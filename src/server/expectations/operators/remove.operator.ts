import _ from 'lodash';

import { buildExpectationOperatorHandler, extractContextPayloadSegment } from './utils';
import { extractByJsonPathSafe } from '../../../utils';

export default buildExpectationOperatorHandler<'$remove'>((mode, schema, context) => {
  if (mode !== 'manipulation' || !schema.$location) {
    return true;
  }

  const payload = extractContextPayloadSegment(schema.$location, context);
  if (payload?.type !== 'object') {
    return true;
  }

  if (schema.$path) {
    _.unset(payload.value, schema.$path);
    return true;
  }
  if (schema.$jsonPath) {
    extractByJsonPathSafe({ path: schema.$jsonPath, json: payload.value })
      .results?.forEach((segment) => _.unset(segment.parent, segment.parentProperty));

    return true;
  }

  return true;
});
