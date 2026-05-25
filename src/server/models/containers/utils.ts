import { Value } from '@n1k1t/typebox/value';

export const compileContainerKey =
  (key: string | object) => typeof key === 'object' ? Value.Hash(key).toString() : String(key);
