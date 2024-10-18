import _ from 'lodash';
import merge from 'deepmerge';

import { buildExpectationOperatorHandler, extractContextPayloadSegment } from './utils';
import { extractByJsonPathSafe } from '../../../utils';

export default buildExpectationOperatorHandler<'$merge'>((mode, schema, context) => {
  if (mode !== 'manipulation' || !schema.$location || schema.$value === undefined) {
    return true;
  }

  const payload = extractContextPayloadSegment(schema.$location, context);
  if (payload?.type !== 'object') {
    return true;
  }

  if (schema.$path) {
    _.set(payload.value, schema.$path, merge(_.get(payload.value, schema.$path), schema.$value ?? {}));
    return true;
  }
  if (schema.$jsonPath) {
    extractByJsonPathSafe({ path: schema.$jsonPath, json: payload.value })
      .results?.forEach(
        (segment) => _.set(
          payload.value,
          segment.pointer.substring(1).replace(/\//g, '.'),
          merge(_.get(segment.parent, segment.parentProperty), schema.$value ?? {})
        )
      );

    return true;
  }

  _.set(payload.parent, payload.key, merge(payload.value, schema.$value ?? {}));
  return true;
});
