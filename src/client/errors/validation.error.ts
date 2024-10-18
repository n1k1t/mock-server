import { IRequestConfiguration } from './types';

export class ValidationError extends Error {
  constructor(
    public configuration: IRequestConfiguration,
    public reasons?: unknown[]
  ) {
    super('Got validation error');
  }
}
