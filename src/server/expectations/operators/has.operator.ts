import minimatch from 'minimatch';
import _ from 'lodash';

import { buildExpectationOperatorHandler, extractContextPayloadSegment } from './utils';
import { extractByJsonPathSafe } from '../../../utils';

export default buildExpectationOperatorHandler<'$has'>((mode, schema, context) => {
  if (!schema.$location) {
    return false;
  }

  const payload = extractContextPayloadSegment(schema.$location, context);
  if (!payload) {
    return false;
  }

  switch(payload.type) {
    case 'string': {
      if (schema.$value !== undefined) {
        return payload.value === schema.$value;
      }
      if (schema.$valueAnyOf) {
        return schema.$valueAnyOf.some((value) => payload.value === value);
      }

      if (schema.$regExp) {
        return schema.$regExp.test(payload.value);
      }
      if (schema.$regExpAnyOf) {
        return schema.$regExpAnyOf.some((regExp) => regExp.test(payload.value));
      }

      if (schema.$minimatch) {
        return minimatch(payload.value, schema.$minimatch);
      }
      if (schema.$minimatchAnyOf) {
        return schema.$minimatchAnyOf.some((pattern) => minimatch(payload.value, pattern));
      }
    }

    case 'number': {
      if (schema.$value !== undefined) {
        return payload.value === schema.$value;
      }
      if (schema.$valueAnyOf) {
        return schema.$valueAnyOf.some((value) => payload.value === value);
      }

      if (schema.$minimatch) {
        return minimatch(String(payload.value), schema.$minimatch);
      }
      if (schema.$minimatchAnyOf) {
        const value = String(payload.value);
        return schema.$minimatchAnyOf.some((pattern) => minimatch(value, pattern));
      }
    }

    case 'object': {
      const values = schema.$path
        ? [_.get(payload.value, schema.$path)]
        : schema.$jsonPath
        ? extractByJsonPathSafe({ path: schema.$jsonPath, json: payload.value }).results?.map(({ value }) => value) ?? []
        : [];

      if (schema.$value !== undefined) {
        return values.every((value) => schema.$value === value);
      }
      if (schema.$valueAnyOf) {
        return values.every((valueToCheck) => (schema.$valueAnyOf!).some((value) => valueToCheck === value));
      }

      if (schema.$regExp) {
        return values.every((value) => (schema.$regExp!).test(String(value)));
      }
      if (schema.$regExpAnyOf) {
        return values.every((value) => (schema.$regExpAnyOf!).some((regExp) => regExp.test(String(value))));
      }

      if (schema.$minimatch) {
        return values.every((value) => minimatch(String(value), schema.$minimatch!));
      }
      if (schema.$minimatchAnyOf) {
        return values.every((value) => (schema.$minimatchAnyOf!).some((pattern) => minimatch(String(value), pattern)));
      }

      return values.length !== 0;
    }

    default: return false;
  }
});
