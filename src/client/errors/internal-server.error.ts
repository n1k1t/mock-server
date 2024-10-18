import { IRequestConfiguration } from './types';

export class InternalServerError extends Error {
  constructor(
    public configuration: IRequestConfiguration,
    message: string
  ) {
    super(`Got internal server error [${message}]`);
  }
}
