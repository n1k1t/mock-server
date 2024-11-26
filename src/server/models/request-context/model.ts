import type { TRequestContextType } from './types';
import type { ServerContext } from '../server-context';

import { Reply } from '../reply';

export abstract class RequestContext<K extends TRequestContextType = TRequestContextType> {
  public abstract reply: Reply;

  public timestamp = Date.now();
  public completed = false;

  constructor(public type: K, public server: ServerContext) {}

  public complete() {
    return Object.assign(this, { completed: true });
  }

  public is<
    This extends RequestContext<any>,
    T extends TRequestContextType
  >(this: This, type: T): this is This & { type: T } {
    return this.type === type;
  }
}
