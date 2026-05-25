import type { IServerContext } from '../../types';
import type { MockServer } from '../../index';

import { SystemProvider } from './system';
import { Provider } from './model';
import { Logger } from '../../../logger';

const logger = Logger.build('Server.Models.ProvidersStorage');

export class ProvidersStorage<TContext extends IServerContext = any> extends Map<string, Provider> {
  public default = Provider.build<TContext>({ group: 'default' });
  public system = SystemProvider.build({ group: 'system', history: { limit: Infinity } });

  constructor(protected server: MockServer) {
    super();
  }

  public extract(): Provider[] {
    return [...this.values(), this.default];
  }

  public register(provider: Provider): this {
    const existent = this.get(provider.group);

    provider.assign({ server: this.server });
    this.system.distribute(provider);

    if (this.default === provider) {
      return this;
    }

    if (existent) {
      if (existent === provider) {
        return this;
      }

      logger.warn(`Provider group [${provider.group}] is already registered. Extending...`);
      existent.extend(provider);

      return this;
    }

    logger.info(`Provider group [${provider.group}] has registered`);
    return this.set(provider.group, provider);
  }

  /** Deletes provider from storage */
  public unregister(provider: Provider): this {
    this.delete(provider.group);
    return this;
  }

  public collectExpired(): Provider[] {
    const timestamp = Date.now();
    return [...this.values()].filter((provider) => provider.expiresAt < timestamp);
  }

  static build<TContext extends IServerContext>(server: MockServer): ProvidersStorage<TContext> {
    return new ProvidersStorage(server);
  }
}
