import { Server } from 'socket.io';

import { ExpectationsStorage } from '../../expectations/models/storage';
import { buildWsExchange } from '../ws-exchange';
import { HistoryStorage } from '../history/storage';
import { OnsiteClient } from '../../client';

import config from '../../config';

export class ServerContext {
  public client = OnsiteClient.build(this);
  public config = config;

  public storage = {
    expectations: new ExpectationsStorage(),
    history: new HistoryStorage(),
  };

  public exchange = {
    ws: buildWsExchange({ emit: () => false }),
  };

  public assignWsExchange(io: Server) {
    this.exchange.ws = buildWsExchange(io);
    return this;
  }

  static build() {
    return new ServerContext();
  }
}
