import type { IServerContext } from '../../types';
import type { MockServer } from '../../index';

import { Provider } from './model';
import { Logger } from '../../../logger';

const logger = Logger.build('Server.Models.ProvidersStorage');

export class ProvidersStorage<
  TContext extends IServerContext = IServerContext
> extends Map<string, Provider<TContext>> {
  public default = Provider.build<TContext>({ group: 'default' });
  public system = Provider.build<TContext>({ group: 'system', history: { limit: Infinity } });

  constructor(protected server: MockServer<any, any>) {
    super();
  }

  public extract(): Provider<TContext>[] {
    return [...this.values(), this.default];
  }

  public register(provider: Provider<any>): this {
    provider.assign({ server: this.server });

    if (this.default === provider) {
      return this;
    }
    if (this.has(provider.group)) {
      logger.info(`Provider group [${provider.group}] is already registered. Using existent...`);
      return this;
    }

    for (const history of this.system.storages.history.values()) {
      if (history.group !== provider.group) {
        continue;
      }

      provider.storages.history.register(history);
      this.system.storages.history.delete(history.id);
    }

    logger.info(`Provider group [${provider.group}] has registered`);
    return this.set(provider.group, provider);
  }

  static build<TContext extends IServerContext = IServerContext>(
    server: MockServer<any, any>
  ): ProvidersStorage<TContext> {
    return new ProvidersStorage(server);
  }
}
