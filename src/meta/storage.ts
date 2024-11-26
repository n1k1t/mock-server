import { AsyncLocalStorage } from 'async_hooks';

import { MetaContext, TMetaContext } from './model';
import { TFunction } from '../types';

export class MetaStorage {
  private storage = new AsyncLocalStorage<MetaContext>();

  public provide() {
    return this.storage.getStore() ?? this.generate();
  }

  public generate(payload: TMetaContext = {}) {
    return payload instanceof MetaContext ? payload : MetaContext.build(payload);
  }

  public wrap<T>(payload: TMetaContext = {}, handler: TFunction<T>) {
    return this.storage.run(this.generate(payload), handler);
  }
}
