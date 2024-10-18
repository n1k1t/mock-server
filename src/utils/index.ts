import { JSONPath, JSONPathOptions } from 'jsonpath-plus';

export interface IJsonPathExtractionResult {
  value: object;
  parent: object;
  pointer: string;
  parentProperty: string;
};

export const extractByJsonPathSafe = (params: Omit<JSONPathOptions, 'resultType'>) => {
  try {
    return <const>{
      status: 'OK',
      results: JSONPath<IJsonPathExtractionResult[]>(Object.assign(params, <const>{ resultType: 'all' })),
    };
  } catch(error) {
    return <const>{
      status: 'ERROR',
      error: error instanceof Error ? error : new Error('Unknown'),
    };
  }
};

export const parseJsonSafe = <T extends Record<string, unknown>>(serializedJson: string) => {
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
