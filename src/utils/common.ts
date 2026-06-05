import _ from 'lodash';

export const cast = <T>(payload: T) => payload;
export const wait = (ms: number) => {
  const context = {
    isCanceled: false,
    timeout: <NodeJS.Timeout | undefined>undefined,
  };

  const promise = new Promise<void>((resolve) =>
    context.isCanceled ? resolve() : (context.timeout = setTimeout(resolve, ms))
  );

  return Object.assign(promise, {
    value: ms,
    abort: () => {
      context.isCanceled = true;
      clearTimeout(context.timeout);
    },
  });
};

/**
 * @example
 * ```ts
 * const counter = buildCounter(5);
 *
 * counter() // 6
 * counter() // 7
 * counter(2) // 9
 * ```
 */
export const buildCounter =
  (initial = 0, step = 1) =>
  (value = step) =>
    (initial += value);

export const serializeRegExp = (exp: RegExp): Pick<RegExp, 'source' | 'flags'> => ({
  source: exp.source,
  flags: exp.flags,
});

export const parseJsonSafe = <T extends object>(serializedJson: string) => {
  try {
    return <const>{
      status: 'OK',
      result: <T>JSON.parse(serializedJson),
    };
  } catch(error) {
    return <const>{
      status: 'ERROR',
      error: error instanceof Error ? error : new Error('Unknown'),
    };
  }
};

/** Joins propeties arrays and renames keys to lower case */
export const formatHeaders = (headers: object): Record<string, string> =>
  Object.entries(headers).reduce<Record<string, string>>(
    (acc, [key, value]) => _.set(acc, key.toLowerCase(), Array.isArray(value) ? value.join(',') : String(value)),
    {}
  );

/**
 * Cuts massive string to a cunks with limited length
 *
 * @example
 * ```ts
 * cut('foobarbaz', 3) // ['foo', 'bar', 'baz']
 * ```
 */
export const cut = (value: string, length: number): string[] => {
  const result: string[] = [];

  for (let i = 0; i < Math.ceil(value.length / length); i++) {
    result.push(value.substring(i * length, (i + 1) * length));
  }

  return result;
};
