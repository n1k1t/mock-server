import type { Expectation } from '../../expectations';
import type { HistoryRecord } from '../history';

export interface IWebSocketExchangeEventToPayloadMap {
  'expectation:added': Expectation;
  'expectation:updated': Expectation;

  'history:added': HistoryRecord;
  'history:updated': HistoryRecord;
}

export interface IWebSocketExchange {
  publish: <K extends keyof IWebSocketExchangeEventToPayloadMap>(
    channel: K,
    payload: IWebSocketExchangeEventToPayloadMap[K]
  ) => unknown;
}
