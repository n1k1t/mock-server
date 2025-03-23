import type { IServerContext } from '../../types';
import type { MockServer } from '../../index';

import { Provider } from './model';
import { Logger } from '../../../logger';

const logger = Logger.build('Server.Models.ProvidersStorage');

export class ProvidersStorage<TContext extends IServerContext<any>> extends Map<string, Provider<TContext>> {
  public default = Provider.build<TContext>({ group: 'default' });

  constructor(private server: MockServer<any, TContext>) {
    super();
  }

  public register(provider: Provider<TContext>): this {
    if (this.has(provider.group)) {
      logger.info(`Provider group [${provider.group}] is already registred. Using existent...`);
      return this;
    }

    logger.info(`Provider group [${provider.group}] has registred`);
    return this.set(provider.group, provider.assign({ server: this.server }));
  }
}
