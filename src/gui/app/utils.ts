import _isObject from 'lodash/isObject';

export const convertObjectToKeyValueCouples =
  (object: object, paths: string[], prefix: string = ''): [string, unknown][] =>
    Object.entries(object).reduce<[string, unknown][]>((acc, [key, value]) => {
      const path = `${prefix}${prefix ? '.' : ''}${key}`;

      return _isObject(value) && !paths.includes(path)
        ? acc.concat(convertObjectToKeyValueCouples(value, paths, path))
        : acc.concat([[path, value]]);
    }, []);

export const buildCounter = (initial: number = 0, step: number = 1) => (value = step) => (initial += value);
