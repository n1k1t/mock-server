import _ from 'lodash';

import { Service } from '../models';
import { Logger } from '../../logger';

export interface IRedisUsage {
  count: number;
  bytes: number;
}

const logger = Logger.build('Services.Analytics');

export class AnalyticsService extends Service {
  public async calculateRedisUsage(prefix?: string): Promise<IRedisUsage> {
    if (!this.server.databases.redis) {
      return { count: 0, bytes: 0 };
    }

    return new Promise<IRedisUsage>((resolve, reject) => {
      const match = `${this.server.databases.redis!.options.keyPrefix ?? ''}${prefix ?? ''}*`;
      const stream = this.server.databases.redis!.scanStream({ match });

      const result: IRedisUsage = { count: 0, bytes: 0 };

      stream.once('end', () => resolve(result));
      stream.once('error', (error) => {
        logger.error('Got error while scan execution', error?.stack ?? error);
        stream.close();

        reject(error);
      });

      stream.on('data', async (keys: string[]) => {
        stream.pause();

        result.count += keys.length;

        const usage = await Promise
          .all(keys.map(async (key) => this.server.databases.redis!.call('MEMORY', 'USAGE', key)))
          .catch((error) => {
            logger.error('Got error while fetching memory usage', error?.stack ?? error);
            stream.close();

            reject(error);
            return [];
          });

        usage.forEach((bytes) => result.bytes += Number(bytes));

        stream.resume();
      });
    });
  }

  static build(server: Service['server']) {
    return new AnalyticsService(server);
  }
}
