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
