import { IRequestConfiguration } from './types';

export class ConnectionError extends Error {
  constructor(public configuration: IRequestConfiguration, message: string = 'Unknown') {
    super(`Cant connect [${message}]`);
  }
}
