import _isObject from 'lodash/isObject';
import hash from 'fnv1a';

export const convertObjectToKeyValueCouples =
  (object: object, paths: string[], prefix: string = ''): [string, unknown][] =>
    Object.entries(object).reduce<[string, unknown][]>((acc, [key, value]) => {
      const path = `${prefix}${prefix ? '.' : ''}${key}`;

      return _isObject(value) && !paths.includes(path)
        ? acc.concat(convertObjectToKeyValueCouples(value, paths, path))
        : acc.concat([[path, value]]);
    }, []);

export const buildCounter = (initial: number = 0, step: number = 1) => (value = step) => (initial += value);
export const calculateColor = (text: string) => `hsl(${Math.floor(hash(text)) / 5 % 360}, 100%, 74%)`;
