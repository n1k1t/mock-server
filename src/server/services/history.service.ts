import _ from 'lodash';

import { History, Service } from '../models';
import { parseJsonSafe } from '../../utils';
import { RxConverter } from '../utils';
import { Logger } from '../../logger';

import config from '../../config';

const logger = Logger.build('Services.History');

export class HistoryService extends Service {
  public async restore(): Promise<void | null> {
    if (!this.server.databases.redis) {
      return null;
    }

    const { persistence } = config.get('history');
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

      const parsed = parseJsonSafe<History['TPlain'][]>(raw);
      if (parsed.status === 'ERROR') {
        logger.error('Got error while parsing cache', parsed.error?.stack ?? parsed.error);
        continue;
      }

      this.server.providers.system.storages.history.restore(parsed.result);
    }
  }

  public async backup(): Promise<void | null> {
    if (!this.server.databases.redis) {
      return null;
    }

    const { persistence } = config.get('history');
    if (!persistence.isEnabled) {
      return null;
    }

    for (const provider of this.server.providers.extract()) {
      const key = [persistence.key, provider.group].join(':');

      if (!provider.storages.history.size) {
        await this.server.databases.redis.del(key);
        continue;
      }

      const payload = JSON.stringify([...provider.storages.history.values()].map((history) => history.toPlain()));
      await this.server.databases.redis.setex(key, persistence.ttl, payload);
    }
  }

  static build(server: Service['server']) {
    return new HistoryService(server);
  }
}
