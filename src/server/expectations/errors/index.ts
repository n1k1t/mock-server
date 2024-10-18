import { ValueError } from '@n1k1t/typebox/errors';

export class ExpectationValidationError extends Error {
  constructor(public reasons: ValueError[]) {
    super('Got error on expectation validation');
  }
}
