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

  public extract(): Provider[] {
    return [...this.values(), this.default];
  }

  public register(provider: Provider<TContext>): this {
    provider.assign({ server: this.server });

    if (this.default === provider) {
      return this;
    }
    if (this.has(provider.group)) {
      logger.info(`Provider group [${provider.group}] is already registered. Using existent...`);
      return this;
    }

    logger.info(`Provider group [${provider.group}] has registered`);
    return this.set(provider.group, provider);
  }
}
