import merge from 'deepmerge';
import { PartialDeep } from '../../../../types';

export class ConfigService {
  public storage = {
    history: {
      limit: 100,
    },
  };

  public assign(payload: PartialDeep<ConfigService['storage']>): this {
    this.storage = merge(this.storage, <ConfigService['storage']>payload, { arrayMerge: (target, source) => source });
    return this;
  }

  static build(): ConfigService {
    return new ConfigService();
  }
}
