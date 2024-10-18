import { buildHandlebarsHelper } from './utils';

type TCompareMethod = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';

export const compare = buildHandlebarsHelper<[string, TCompareMethod, string]>(
  (context) =>
  (arg1, method, arg2, { fn, inverse }) => {
    const check = () => {
      switch(method) {
        case 'eq': return arg1 === arg2;
        case 'neq': return arg1 !== arg2;
        case 'lt': return arg1 < arg2;
        case 'lte': return arg1 <= arg2;
        case 'gt': return arg1 > arg2;
        case 'gte': return arg1 >= arg2;
        default: return false;
      }
    }

    return check() ? fn(context) : inverse(context);
  }
);

export const toLocaleTime = buildHandlebarsHelper<[number]>(
  () => (timestamp) => new Date(timestamp).toLocaleTimeString()
);
