import { handleRequestError } from './utils';
import { ConnectionError } from './errors';
import { InternalServerError } from './errors';
import { ValidationError } from './errors';

// Test generated using Keploy
test('handleRequestError should throw ConnectionError when error.response is undefined', () => {
  const mockError = {
    config: {
      baseURL: 'http://example.com',
      method: 'GET',
      url: '/endpoint'
    },
    response: undefined
  };

  expect(() => handleRequestError(<any>mockError)).toThrow(ConnectionError);
});

// Test generated using Keploy
test('handleRequestError should throw InternalServerError for INTERNAL_ERROR code', () => {
  const mockError = {
    config: {
      baseURL: 'http://example.com',
      method: 'GET',
      url: '/endpoint'
    },
    response: {
      data: {
        code: 'INTERNAL_ERROR',
        data: {
          message: 'An internal server error occurred'
        }
      }
    }
  };

  expect(() => handleRequestError(<any>mockError)).toThrow(InternalServerError);
});

// Test generated using Keploy
test('handleRequestError should throw ValidationError for VALIDATION_ERROR code', () => {
  const mockError = {
    config: {
      baseURL: 'http://example.com',
      method: 'POST',
      url: '/endpoint'
    },
    response: {
      data: {
        code: 'VALIDATION_ERROR',
        data: {
          reasons: ['Invalid input']
        }
      }
    }
  };

  expect(() => handleRequestError(<any>mockError)).toThrow(ValidationError);
});
