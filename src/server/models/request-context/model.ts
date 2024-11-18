import type { TRequestContextType } from './types';
import type { ServerContext } from '../server-context';

import { ReplyService } from '../reply-service';

export abstract class RequestContext<K extends TRequestContextType = TRequestContextType> {
  public abstract reply: ReplyService;

  constructor(public type: K, public server: ServerContext) {}

  public is<
    This extends RequestContext<any>,
    T extends TRequestContextType
  >(this: This, type: T): this is This & { type: T } {
    return this.type === type;
  }
}
