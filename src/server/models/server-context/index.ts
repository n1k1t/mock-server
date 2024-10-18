import type { Server } from 'socket.io';

import { IWebSocketExchange, buildWebSocketExchange } from '../../web-socket-exchange';
import { ExpectationsStorage } from '../../expectations/storage';
import { HistoryStorage } from '../../history/storage';

export class ServerContext {
  public expectationsStorage = new ExpectationsStorage();
  public historyStorage = new HistoryStorage();

  public webSocketExchange?: IWebSocketExchange;

  public buildWebSocketExchange(io: Server) {
    return Object.assign(this, { webSocketExchange: buildWebSocketExchange(io) });
  }

  static build() {
    return new ServerContext();
  }
}
