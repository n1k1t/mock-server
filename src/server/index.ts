import '../extensions';

import _ from 'lodash';

import { Redis, RedisOptions } from 'ioredis';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { buildSocketIoExchange, ProvidersStorage, Router, Transport, TransportsStorage } from './models';
import { IIoExchangeSchema, IServerContext, TDefaultServerContext } from './types';
import { AnalyticsService, MetricsService } from './services';
import { Logger } from '../logger';
import {
  buildHttpListener,
  buildWsListener,
  HttpTransport,
  InternalHttpTransport,
  InternalSocketIoTransport,
  WsTransport,
} from './transports';

import config from '../config';

export * from './transports';
export * from './models';
export * from './types';

const logger = Logger.build('Server');

export interface IMockServerConfiguration {
  port: number;
  host: string;

  containers?: {
    /** Seconds `default: 1h` */
    expiredCleaningInterval?: number;
  };

  transports?: Partial<Record<TDefaultServerContext['transport'], Transport>> & Record<string, Transport>;
  databases?: {
    redis?: RedisOptions;
  };
}

export class MockServer<
  TConfiguration extends IMockServerConfiguration = IMockServerConfiguration,
  TContext extends IServerContext<any> = IServerContext<{
    transport: TDefaultServerContext['transport'] | Extract<keyof TConfiguration['transports'], string>;

    event: TDefaultServerContext['event'] | {
      [K in keyof TConfiguration['transports']]: NonNullable<TConfiguration['transports']>[K]['TContext']['event'];
    }[keyof TConfiguration['transports']];

    flag: TDefaultServerContext['flag'] | {
      [K in keyof TConfiguration['transports']]: NonNullable<TConfiguration['transports']>[K]['TContext']['flag'];
    }[keyof TConfiguration['transports']];
  }>
> {
  public TContext!: TContext;

  public timestamp = Date.now();
  public authority = `http://${this.configuration.host}:${this.configuration.port}`;

  public databases = {
    redis: this.configuration.databases?.redis
      ? new Redis({ keyPrefix: 'mock:', ...this.configuration.databases?.redis })
      : null,
  };

  public exchanges = {
    io: buildSocketIoExchange<IIoExchangeSchema>({ emit: () => false }),
  };

  public providers = new ProvidersStorage<TContext>(this);
  public transports = new TransportsStorage<TContext>()
    .register('http', new HttpTransport())
    .register('ws', new WsTransport());

  public router = Router.build<TContext>(this);

  public http = createServer(buildHttpListener(this.router));
  public ws = new WebSocketServer({ server: this.http }).on('connection', buildWsListener(this.router));
  public io = new Server(this.http);

  public services = {
    analytics: AnalyticsService.build(this),
    metrics: MetricsService.build(this),
  };

  private internal = {
    transports: {
      http: new InternalHttpTransport(this),
      io: new InternalSocketIoTransport(this),
    },
  };

  constructor(public configuration: TConfiguration) {
    this.databases.redis?.on('reconnecting', () => logger.info('Redis is reconnecting'));
    this.databases.redis?.on('connect', () => logger.info('Redis has connected'));
    this.databases.redis?.on('close', () => logger.info('Redis has closed'));
    this.databases.redis?.on('error', (error) => logger.info('Got redis error', error?.stack ?? error));
  }

  public get client() {
    return this.providers.default.client;
  }

  public unbindExpiredContainers() {
    this.providers.extract().forEach((provider) =>
      provider.storages.containers.getExpired().forEach((container) => {
        container.unbind();
        logger.info(`Container [${container.key}] has unbinded by expiration of [${container.ttl}] seconds`);
      })
    )
  }

  static async start<
    TConfiguration extends IMockServerConfiguration,
    TContext extends MockServer<TConfiguration>['TContext'] = MockServer<TConfiguration>['TContext']
  >(configuration: TConfiguration) {
    const routes = config.get('routes');
    const server = new MockServer<TConfiguration>(configuration);

    await new Promise<void>((resolve) =>
      server.http.listen(configuration.port, configuration.host, () => {
        logger.info(`Server has started on [${server.authority}]`);
        logger.info(`GUI is available on [${server.authority}${routes.internal.root}${routes.internal.gui}]`);

        resolve();
      })
    );

    Object
      .entries(configuration.transports ?? {})
      .forEach(([type, transport]) => server.transports.register(<TContext['transport']>type, transport));

    server.router.register(`${routes.internal.root}/**`, {
      provider: server.providers.default,
      transports: <Record<TContext['transport'], Transport>>{
        http: server.internal.transports.http,
      },
    });

    setInterval(
      () => server.unbindExpiredContainers(),
      (configuration.containers?.expiredCleaningInterval ?? 60 * 60) * 1000
    );

    setInterval(
      () => server.services.metrics.register('memory', { mbs: process.memoryUsage().heapUsed / 1024 / 1024 }),
      5 * 1000
    );

    setInterval(
      () => server.services.metrics.register('containers', {
        count: server.providers.extract().reduce((acc, provider) => acc + provider.storages.containers.size, 0),
      }),
      5 * 1000
    );

    if (server.databases.redis) {
      setInterval(async () => {
        const redis = await server.services.analytics.calculateRedisUsage();

        server.services.metrics.register('cache', {
          redis_mbs: redis.bytes / 1024 / 1024,
          redis_count: redis.count,
        });
      }, 10 * 60 * 1000);
    }

    return server;
  }
}
