import merge from 'deepmerge';
import { PartialDeep, SetRequiredKeys } from '../types';

export class Config<T extends object = object> {
  public storage: T = merge(this.defaults, JSON.parse(process.env['MOCK_CONFIG'] ?? '{}'));

  constructor(public defaults: T) {}

  public get<K extends keyof T>(key: K): T[K] {
    return this.storage[key];
  }

  public has<K extends keyof T>(key: K): this is SetRequiredKeys<T, K> {
    return key in this.storage;
  }

  public merge(payload: PartialDeep<T>): this {
    return Object.assign(this, { storage: merge(this.storage, <T>payload, { arrayMerge: (target, source) => source }) });
  }

  static build<T extends object>(defaults: T) {
    return new Config(defaults);
  }
}
