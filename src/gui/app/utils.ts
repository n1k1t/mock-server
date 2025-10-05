import _ from 'lodash';

export const convertObjectToKeyValueCouples =
  (object: object, paths: string[], prefix: string = ''): [string, unknown][] =>
    Object.entries(object).reduce<[string, unknown][]>((acc, [key, value]) => {
      const path = `${prefix}${prefix ? '.' : ''}${key}`;

      return _.isObject(value) && !paths.includes(path)
        ? acc.concat(convertObjectToKeyValueCouples(value, paths, path))
        : acc.concat([[path, value]]);
    }, []);

export const calculateColor = (() => {
  const storage = new Map<string, Map<string, string>>([['default', new Map()]]);

  const multipliers = [6, 0, 3, 15, 9, 12];
  const predefined = Array.from(
    { length: 18 },
    (value, index) => `hsl(${multipliers[index % multipliers.length]++ * 20}, 100%, 74%)`
  );

  return (text: string, prefix: string = 'default') => {
    const map = storage.get(prefix) ?? new Map<string, string>();
    const existent = map.get(text);

    if (existent) {
      return existent;
    }
    if (!map.size) {
      storage.set(prefix, map);
    }

    const value = predefined.at(map.size % predefined.length)!;

    map.set(text, value);
    return value;
  }
})();
