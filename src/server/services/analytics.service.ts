import { Observable, of, Subject } from 'rxjs';
import _ from 'lodash';

import { RxConverter } from '../utils';
import { Service } from '../models';
import { Logger } from '../../logger';

import config from '../../config';

export interface IRedisUsage {
  count: number;
  bytes: number;
}

const logger = Logger.build('Services.Analytics');

export class AnalyticsService extends Service {
  public iterateRedisKeys(prefix?: string): Observable<string> {
    if (!this.server.databases.redis) {
      return of();
    }

    const { systemKeyPrefix } = config.get('database');
    const subject = new Subject<string>();

    const match = `${this.server.databases.redis!.options.keyPrefix ?? ''}${prefix ?? ''}*`;
    const stream = this.server.databases.redis!.scanStream({ match });

    stream.once('end', () => setImmediate(() => subject.complete()));
    stream.once('error', (error) => {
      logger.error('Got error while scan execution', error?.stack ?? error);
      stream.close();

      subject.error(error);
    });

    stream.on('data', (keys: string[]) => keys.forEach((key) =>
      key.includes(systemKeyPrefix)
        ? null
        : subject.next(key))
    );

    return subject.asObservable();
  }

  public async calculateRedisUsage(prefix?: string): Promise<IRedisUsage> {
    if (!this.server.databases.redis) {
      return { count: 0, bytes: 0 };
    }

    const converter = RxConverter.build(this.iterateRedisKeys(prefix));
    const result: IRedisUsage = { count: 0, bytes: 0 };

    for await (const key of converter.iterate()) {
      const usage = await this.server.databases.redis!.call('MEMORY', 'USAGE', key).catch((error) => {
        logger.error('Got error while fetching memory usage', error?.stack ?? error);
        throw error;
      });

      result.count += 1;
      result.bytes += Number(usage);
    }

    return result;
  }

  static build(server: Service['server']) {
    return new AnalyticsService(server);
  }
}
