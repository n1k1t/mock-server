import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';
import _ from 'lodash';

import { Redis, RedisOptions } from 'ioredis';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { buildSocketIoExchange, ProvidersStorage, Router, Transport, TransportsStorage } from './models';
import { IIoExchangeSchema, IServerContext, IServerContextDefaults } from './types';
import { OnsiteClient } from '../client';
import { Logger } from '../logger';

import * as transports from './transports';
import * as services from './services';

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

  providers?: {
    /** Seconds `default: 5m` */
    expiredCleaningInterval?: number;
  };

  hooks?: {
    shudown?: {
      /** Enables shutdown events listening like `SIGTERM`, `SIGINT`, etc (default `true`) */
      isEnabled?: boolean;
    };
  };

  transports?: Record<string, Transport>;
  databases?: {
    redis?: RedisOptions;
  };
}

export class MockServer<
  TConfiguration extends IMockServerConfiguration = any,
  TContext extends IServerContext = any
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
    .register('http', new transports.HttpTransport())
    .register('ws', new transports.WsTransport());

  public router: Router<TContext> = Router.build(this);
  public wss = new WebSocketServer({ noServer: true });

  public http = createServer(transports.buildHttpListener<TContext>(this.router))
    .on('upgrade', transports.buildWsListener(this.router));

  public io = new Server(this.http, {
    maxHttpBufferSize: 1e8,

    ...(process.env['NODE_ENV'] === 'development' && {
      cors: { origin: '*' },
    }),
  });

  public services = <const>{
    shutdown: services.ShutdownService.build(this),
    metrics: services.MetricsService.build(this),
    redis: services.RedisService.build(this),

    containers: services.ContainersService.build(this),
    history: services.HistoryService.build(this),
  };

  private system = <const>{
    transports: {
      http: new transports.SystemHttpTransport(this),
      io: new transports.SystemSocketIoTransport(this),
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

  private async setupJobs(): Promise<void> {
    /** Containers expiration */
    setInterval(
      () => this.services.containers.flush(),
      (this.configuration.containers?.expiredCleaningInterval ?? 60 * 60) * 1000
    );

    /** Providers expiration */
    setInterval(
      () => this.providers.expired().forEach((provider) => {
        this.providers.unregister(provider);
        this.router.unregister(provider);
      }),
      (this.configuration.providers?.expiredCleaningInterval ?? 5 * 60) * 1000
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
      10 * 60 * 1000
    );

    /** Reqests rate blank metrics */
    setInterval(() => this.services.metrics.register('rate', { count: 0 }), 60 * 1000);

    if (this.databases.redis) {
      /** Containers persistence */
      setInterval(() => this.services.containers.backup(), 10 * 60 * 1000);

      /** History persistence */
      setInterval(() => this.services.history.backup(), 10 * 60 * 1000);

      /** Redis usage metrics */
      setInterval(async () => {
        const usage = await this.services.redis.usage();

        this.services.metrics.register('cache', {
          redis_mbs: usage.bytes / 1024 / 1024,
          redis_count: usage.count,
        });
      }, 10 * 60 * 1000);
    }

    if (this.configuration.hooks?.shudown?.isEnabled !== false) {
      process.on('SIGTERM', () => this.services.shutdown.exit());
      process.on('SIGQUIT', () => this.services.shutdown.exit());
      process.on('SIGINT', () => this.services.shutdown.exit());
      process.on('SIGHUP', () => this.services.shutdown.exit());
    }
  }

  /** Starts and setups mock server */
  static async start<
    TConfiguration extends IMockServerConfiguration,
    TContext extends IServerContext = {
      transport: IServerContextDefaults['transport'] | Extract<keyof TConfiguration['transports'], string>;

      flag: IServerContextDefaults['flag'] | {
        [K in keyof TConfiguration['transports']]: NonNullable<TConfiguration['transports']>[K]['TContext']['flag'];
      }[keyof TConfiguration['transports']];
    }
  >(configuration: TConfiguration): Promise<MockServer<TConfiguration, TContext>> {
    const routes = config.get('routes');
    const server = new MockServer<TConfiguration, TContext>(configuration);

    await new Promise<void>((resolve) =>
      server.http.listen(configuration.port, configuration.host, () => {
        logger.info(`Has started on [${server.authority}]`);
        logger.info(`GUI is available on [${server.authority}${routes.system.root}${routes.system.gui}/]`);

        resolve();
      })
    );

    Object
      .entries(configuration.transports ?? {})
      .forEach(([type, transport]) => server.transports.register(<TContext['transport']>type, transport));

    await server.services.containers.restore();
    await server.services.history.restore();

    await server.setupJobs();

    server.router.register(`${routes.system.root}/**`, {
      provider: server.providers.default,
      transports: <Record<TContext['transport'], Transport>>{
        http: server.system.transports.http,
      },
    });

    return server;
  }
}
