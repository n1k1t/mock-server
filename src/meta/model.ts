import { v4 as genUid } from 'uuid';
import _ from 'lodash';

import type { PickWithType } from '../types';

export type TMetaContext = Partial<PickWithType<MetaContext, string | number | boolean>>;

export class MetaContext {
  public requestId: string = 'unknown';
  public operationId: string = 'unknown';

  public merge(context: TMetaContext) {
    return Object.assign(this, context);
  }

  public pick<K extends keyof TMetaContext>(keys: K[]): Pick<this, K> {
    return _.pick(this, keys);
  }

  static build(context?: Partial<Pick<MetaContext, 'operationId' | 'requestId'>>) {
    return Object.assign(
      new MetaContext(),
      _.defaults(context ?? {}, {
        requestId: genUid(),
        operationId: genUid(),
      })
    );
  }
}
