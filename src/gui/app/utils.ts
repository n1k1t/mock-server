import _isObject from 'lodash/isObject';

export const convertObjectToKeyValueCouples =
  (object: object, prefix: string = ''): [string, unknown][] =>
    Object.entries(object).reduce<[string, unknown][]>((acc, [key, value]) => {
      if (_isObject(value)) {
        return acc.concat(exports.convertObjectToKeyValueCouples(value, `${prefix}${key}.`));
      }

      acc.push([`${prefix}${key}`, value]);
      return acc;
    }, []);

export const buildCounter = (initial: number = 0, step: number = 1) => (value = step) => (initial += value);
