import type { Expectation } from '../../expectations';
import type { History } from '../history';

export interface IWsExchangeEventToPayloadMap {
  'expectation:added': Expectation<any>['TPlain'];
  'expectation:updated': Expectation<any>['TPlain'];

  'history:added': History['TPlain'];
  'history:updated': History['TPlain'];
}

export interface IWsExchangeService {
  publish: <K extends keyof IWsExchangeEventToPayloadMap>(
    channel: K,
    payload: IWsExchangeEventToPayloadMap[K]
  ) => unknown;
}
