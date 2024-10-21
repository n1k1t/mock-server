import _ from 'lodash';

import { buildExpectationOperatorHandler, extractContextPayloadSegment } from './utils';
import { extractByJsonPathSafe } from '../../utils';

export default buildExpectationOperatorHandler<'$set'>((mode, schema, context) => {
  if (mode !== 'manipulation' || !schema.$location || schema.$value === undefined) {
    return true;
  }

  const payload = extractContextPayloadSegment(schema.$location, context);
  if (!payload) {
    return true;
  }

  switch(payload.type) {
    case 'number':
    case 'string': {
      _.set(payload.parent, payload.key, schema.$value);
      return true;
    }

    case 'object': {
      if (schema.$path) {
        _.set(payload.value, schema.$path, schema.$value);
        return true;
      }
      if (schema.$jsonPath) {
        extractByJsonPathSafe({ path: schema.$jsonPath, json: payload.value })
          .results?.forEach((segment) => _.set(segment.parent, segment.parentProperty, schema.$value));

        return true;
      }

      _.set(payload.parent, [payload.key], schema.$value);
      return true;
    }

    default: return true;
  }
});
