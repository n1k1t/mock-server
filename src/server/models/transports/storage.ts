import type { IServerContext } from '../../types';
import type { Transport } from './model';

import { Logger } from '../../../logger';

const logger = Logger.build('Server.Models.TransportsStorage');

export class TransportsStorage<
  TContext extends IServerContext = IServerContext
> extends Map<TContext['transport'], Transport> {
  public register(type: TContext['transport'], transport: Transport): this {
    logger.info(`Transport [${type}] has registered`);
    return this.set(type, transport);
  }

  static build<TContext extends IServerContext = IServerContext>(): TransportsStorage<TContext> {
    return new TransportsStorage();
  }
}
