import _ from 'lodash';

import { Container, Service } from '../models';
import { parseJsonSafe } from '../../utils';
import { RxConverter } from '../utils';
import { Logger } from '../../logger';

import config from '../../config';

const logger = Logger.build('Services.Containers');

export class ContainersService extends Service {
  public async restore(): Promise<void | null> {
    if (!this.server.databases.redis) {
      return null;
    }

    const { persistence } = config.get('containers');
    if (!persistence.isEnabled) {
      return null;
    }

    const converter = RxConverter.build(
      this.server.services.redis.iterate([persistence.key, '*'].join(':'), {
        ignore: [],
        trim: true,
      })
    );

    for await (const key of converter.iterate()) {
      const raw = await this.server.databases.redis.get(key).catch((error) => {
        logger.error(`Got error while fetching payload by key [${key}]`, error?.stack ?? error);
        return null;
      });

      if (!raw) {
        continue;
      }

      const parsed = parseJsonSafe<Container['TBackup'][]>(raw);
      if (parsed.status === 'ERROR') {
        logger.error('Got error while parsing cache', parsed.error?.stack ?? parsed.error);
        continue;
      }

      this.server.providers.system.storages.containers.restore(parsed.result);
    }
  }

  public async backup(): Promise<void | null> {
    if (!this.server.databases.redis) {
      return null;
    }

    const { persistence } = config.get('containers');
    if (!persistence.isEnabled) {
      return null;
    }

    for (const provider of this.server.providers.extract()) {
      const key = [persistence.key, provider.group].join(':');

      if (!provider.storages.history.size) {
        await this.server.databases.redis.del(key);
        continue;
      }

      const payload = JSON.stringify([...provider.storages.containers.values()].map((container) => container.toBackup()));
      await this.server.databases.redis.setex(key, persistence.ttl, payload);
    }
  }

  /** Flushes expired containers and aliases */
  public flush(): void {
    this.server.providers.extract().forEach((provider) =>
      provider.storages.containers.expired().forEach((container) => {
        container.unbind();
        logger.info(`Container [${container.key}] has unbinded by expiration of [${container.ttl}] seconds`);
      })
    );
  }

  static build(server: Service['server']) {
    return new ContainersService(server);
  }
}
