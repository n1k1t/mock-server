import { Server } from 'socket.io';
import { Redis } from 'ioredis';

import { ExpectationsStorage } from '../../expectations/models/storage';
import { ContainersStorage } from './containers';
import { buildWsExchange } from '../ws-exchange';
import { HistoryStorage } from '../history/storage';
import { OnsiteClient } from '../../client';
import { Plugins } from './plugins';
import { Logger } from '../../logger';

import config from '../../config';

const logger = Logger.build('Server.Models.ServerContext');

export class ServerContext {
  public client = OnsiteClient.build(this);
  public plugins = new Plugins();

  public storages = {
    expectations: new ExpectationsStorage(),
    containers: new ContainersStorage(),
    history: new HistoryStorage(),

    redis: config.has('redis') ? new Redis(config.get('redis')) : undefined,
  };

  constructor() {
    this.storages.redis?.on('reconnecting', () => logger.info('Redis is reconnecting'));
    this.storages.redis?.on('connect', () => logger.info('Redis has connected'));
    this.storages.redis?.on('close', () => logger.info('Redis has closed'));
    this.storages.redis?.on('error', (error) => logger.info('Got redis error', error?.stack ?? error));
  }

  public exchanges = {
    ws: buildWsExchange({ emit: () => false }),
  };

  public assignWsExchange(io: Server) {
    this.exchanges.ws = buildWsExchange(io);
    return this;
  }

  static build() {
    return new ServerContext();
  }
}
