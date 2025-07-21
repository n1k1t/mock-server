import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';
import _ from 'lodash';

import { Redis, RedisOptions } from 'ioredis';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { buildSocketIoExchange, ProvidersStorage, Router, Transport, TransportsStorage } from './models';
import { IIoExchangeSchema, IServerContext, IServerContextDefaults } from './types';
import { AnalyticsService, MetricsService } from './services';
import { OnsiteClient } from '../client';
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

dayjs.extend(relativeTimePlugin);

const logger = Logger.build('Server');

export interface IMockServerConfiguration {
  port: number;
  host: string;

  containers?: {
    /** Seconds `default: 1h` */
    expiredCleaningInterval?: number;
  };

  transports?: Partial<Record<string, Transport>> & Record<string, Transport>;
  databases?: {
    redis?: RedisOptions;
  };
}

export class MockServer<
  TConfiguration extends IMockServerConfiguration = IMockServerConfiguration,
  TContext extends IServerContext = IServerContext
> {
  public TContext!: TContext;

  public timestamp: number = Date.now();
  public authority: string = `http://${this.configuration.host}:${this.configuration.port}`;

  public databases = {
    redis: this.configuration.databases?.redis
      ? new Redis({ keyPrefix: 'mock:', ...this.configuration.databases?.redis })
      : null,
  };

  public exchanges = {
    io: buildSocketIoExchange<IIoExchangeSchema>({ emit: () => false }),
  };

  public providers: ProvidersStorage<TContext> = ProvidersStorage.build<TContext>(this);
  public transports: TransportsStorage<TContext> = TransportsStorage.build<TContext>()
    .register('http', new HttpTransport())
    .register('ws', new WsTransport());

  public router: Router<TContext> = Router.build(this);

  public http = createServer(buildHttpListener(this.router));
  public ws = new WebSocketServer({ server: this.http }).on('connection', buildWsListener(this.router));

  public io = new Server(this.http, {
    maxHttpBufferSize: 1e8,

    ...(process.env['NODE_ENV'] === 'development' && {
      cors: { origin: '*' },
    }),
  });

  public services = <const>{
    analytics: AnalyticsService.build(this),
    metrics: MetricsService.build(this),
  };

  private internal = <const>{
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

  /** Default client to work with main API */
  public get client(): OnsiteClient<TContext> {
    return this.providers.default.client;
  }

  /** Unbinds expired containers */
  public unbindExpiredContainers(): this {
    this.providers.extract().forEach((provider) =>
      provider.storages.containers.getExpired().forEach((container) => {
        container.unbind();
        logger.info(`Container [${container.key}] has unbinded by expiration of [${container.ttl}] seconds`);
      })
    );

    return this;
  }

  /** Setups background jobs */
  private async setupJobs(): Promise<void> {
    /** Containers expiration */
    setInterval(
      () => this.unbindExpiredContainers(),
      (this.configuration.containers?.expiredCleaningInterval ?? 60 * 60) * 1000
    );

    /** Memory metrics */
    setInterval(
      () => this.services.metrics.register('memory', { mbs: process.memoryUsage().heapUsed / 1024 / 1024 }),
      5 * 1000
    );

    /** Containers metrics */
    setInterval(
      () => this.services.metrics.register('containers', {
        count: this.providers.extract().reduce((acc, provider) => acc + provider.storages.containers.size, 0),
      }),
      5 * 1000
    );

    /** Redis usage metrics */
    if (this.databases.redis) {
      setInterval(async () => {
        const usage = await this.services.analytics.calculateRedisUsage();

        this.services.metrics.register('cache', {
          redis_mbs: usage.bytes / 1024 / 1024,
          redis_count: usage.count,
        });
      }, 10 * 60 * 1000);
    }
  }

  /** Recoveres persitenated history */
  private async recoverHistory(): Promise<void | null> {
    if (!this.databases.redis) {
      return null;
    }

    const { persistence } = config.get('history');
    if (!persistence.isEnabled) {
      return null;
    }

    const list = await this.databases.redis.lrange(persistence.key, 0, -1);
    this.providers.system.storages.history.inject(list.map((raw) => JSON.parse(raw)));
  }

  /** Starts and setups mock server */
  static async start<
    TConfiguration extends IMockServerConfiguration,
    TContext extends IServerContext = IServerContext<{
      transport: IServerContextDefaults['transport'] | Extract<keyof TConfiguration['transports'], string>;

      event: IServerContextDefaults['event'] | {
        [K in keyof TConfiguration['transports']]: NonNullable<TConfiguration['transports']>[K]['TContext']['event'];
      }[keyof TConfiguration['transports']];

      flag: IServerContextDefaults['flag'] | {
        [K in keyof TConfiguration['transports']]: NonNullable<TConfiguration['transports']>[K]['TContext']['flag'];
      }[keyof TConfiguration['transports']];
    }>
  >(configuration: TConfiguration): Promise<MockServer<TConfiguration, TContext>> {
    const routes = config.get('routes');
    const server = new MockServer<TConfiguration, TContext>(configuration);

    await new Promise<void>((resolve) =>
      server.http.listen(configuration.port, configuration.host, () => {
        logger.info(`Server has started on [${server.authority}]`);
        logger.info(`GUI is available on [${server.authority}${routes.internal.root}${routes.internal.gui}/]`);

        resolve();
      })
    );

    Object
      .entries(configuration.transports ?? {})
      .forEach(([type, transport]) => server.transports.register(<TContext['transport']>type, transport));

    await server.setupJobs();
    await server.recoverHistory();

    server.router.register(`${routes.internal.root}/**`, {
      provider: server.providers.default,
      transports: <Record<TContext['transport'], Transport>>{
        http: server.internal.transports.http,
      },
    });

    return server;
  }
}
