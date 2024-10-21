import { Server } from 'socket.io';

import { buildWebSocketExchange } from '../web-socket-exchange';
import { ExpectationsStorage } from '../../expectations/storage';
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
    ws: buildWebSocketExchange({ emit: () => false }),
  };

  public assignWebSocketExchange(io: Server) {
    this.exchange.ws = buildWebSocketExchange(io);
    return this;
  }

  static build() {
    return new ServerContext();
  }
}
