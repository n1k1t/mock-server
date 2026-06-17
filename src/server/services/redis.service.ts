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

export class RedisService extends Service {
  public iterate(match: string = '*', options?: {
    /** Trims predefined redis key prefix */
    trim?: boolean;

    /** Ignores keys those includes provided values */
    ignore?: string[];
  }): Observable<string> {
    if (!this.server.databases.redis) {
      return of();
    }

    const trim = (options?.trim && this.server.databases.redis!.options.keyPrefix)
      ? this.server.databases.redis!.options.keyPrefix
      : null;

    const ignore = options?.ignore ?? [
      config.get('containers').persistence.key,
      config.get('history').persistence.key,
    ];

    const subject = new Subject<string>();
    const stream = this.server.databases.redis!.scanStream({
      match: `${this.server.databases.redis!.options.keyPrefix ?? ''}${match ?? ''}`,
    });

    stream.once('end', () => setImmediate(() => subject.complete()));
    stream.once('error', (error) => {
      logger.error('Got error while scan execution', error?.stack ?? error);
      stream.close();

      subject.error(error);
    });

    stream.on('data', (keys: string[]) => keys.forEach((key) =>
      ignore.some((nested) => key.includes(nested))
        ? null
        : subject.next(trim ? key.replace(trim, '') : key))
    );

    return subject.asObservable();
  }

  public async usage(prefix?: string): Promise<IRedisUsage> {
    if (!this.server.databases.redis) {
      return { count: 0, bytes: 0 };
    }

    const converter = RxConverter.build(this.iterate(prefix));
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
    return new RedisService(server);
  }
}
