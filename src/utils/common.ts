import type { FlattenArrays } from '../types';

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const cast = <T>(payload: T) => payload;

export const flattenArrayed = <
  T extends unknown[][],
  Q extends FlattenArrays<T>[] = FlattenArrays<T>[]
>(payload: T): Q => {
  if (payload?.every?.(Array.isArray)) {
    return <Q>payload.reduce((acc, nestedPayload) => acc.concat(flattenArrayed(<T>nestedPayload)), []);
  }

  if (Array.isArray(payload)) {
    return <Q>[payload];
  }

  return <Q>[[payload]];
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
