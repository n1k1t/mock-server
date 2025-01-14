import type { IServerContext } from '../../types';
import type { Transport } from './model';

import { Logger } from '../../../logger';

const logger = Logger.build('Server.Models.TransportsStorage');

export class TransportsStorage<TContext extends IServerContext<any>> extends Map<TContext['transport'], Transport> {
  public register(type: TContext['transport'], transport: Transport) {
    logger.info(`Transport [${type}] has registred`);
    return this.set(type, transport);
  }
}
