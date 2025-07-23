import type { FlattenArrays } from '../../types';

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const cast = <T>(payload: T) => payload;

export const flattenArrayed = <
  T extends unknown[][],
  Q extends FlattenArrays<T>[] = FlattenArrays<T>[]
>(payload: T): Q => {
  if (payload?.every?.(Array.isArray)) {
    return <Q>payload.reduce((acc, nestedPayload) => acc.concat(flattenArrayed(<T>nestedPayload)), []);
  }

  return Array.isArray(payload)
    ? <Q>[payload]
    : <Q>[[payload]];
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
