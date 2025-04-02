import { InternalServerError } from './internal-server.error';
import { IRequestConfiguration } from './types';

// Test generated using Keploy
test('InternalServerError initialization correctly sets properties', () => {
  const config: IRequestConfiguration = { /* mock properties of IRequestConfiguration */ };
  const message = 'Service Unavailable';
  const error = new InternalServerError(config, message);

  expect(error.configuration).toEqual(config);
  expect(error.message).toBe('Got internal server error [Service Unavailable]');
});
