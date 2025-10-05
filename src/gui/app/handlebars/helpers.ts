import _ from 'lodash';

import { buildHandlebarsHelper } from './utils';
import { calculateColor } from '../utils';

type TCompareMethod = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';

export const compare = buildHandlebarsHelper<[string, TCompareMethod, string]>(
  (context) =>
  (arg1, operator, arg2, { fn, inverse }) => {
    const check = () => {
      switch(operator) {
        case 'eq': return arg1 === arg2;
        case 'neq': return arg1 !== arg2;
        case 'lt': return arg1 < arg2;
        case 'lte': return arg1 <= arg2;
        case 'gt': return arg1 > arg2;
        case 'gte': return arg1 >= arg2;
        default: return false;
      }
    }

    const result = check();
    return result ? fn ? fn(context) : inverse ? inverse(context) : result : null;
  }
);

export const toSeconds = buildHandlebarsHelper<[number]>(() => (ms) => (ms / 1000).toFixed(3));
export const truncate = buildHandlebarsHelper<[string, number]>(() => (text, length) => _.truncate(text, { length }));

export const toLocaleTime = buildHandlebarsHelper<[number]>(
  () => (timestamp) => new Date(timestamp).toLocaleTimeString()
);

export const toColor = buildHandlebarsHelper<[string, string?]>(
  () => (text, prefix) => calculateColor(text, prefix)
);
