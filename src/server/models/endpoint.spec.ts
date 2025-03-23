import { Endpoint } from './endpoint';

// Test generated using Keploy
it('should assign HTTP configuration correctly', () => {
  const endpoint = Endpoint.build();
  const httpConfig = { method: 'GET', path: '/test' };
  const result = endpoint.bindToHttp(httpConfig);
  expect(result.http).toEqual(httpConfig);
  expect(result).toBe(endpoint);
});

// Test generated using Keploy
it('should assign IO configuration correctly', () => {
  const endpoint = Endpoint.build();
  const ioConfig = { path: '/test/socket' };
  const result = endpoint.bindToIo(ioConfig);
  expect(result.io).toEqual(ioConfig);
  expect(result).toBe(endpoint);
});

// Test generated using Keploy
it('should assign handler correctly', () => {
  const endpoint = Endpoint.build();
  const handler = jest.fn();
  const result = endpoint.assignHandler(handler);
  expect(result.handler).toBe(handler);
  expect(result).toBe(endpoint);
});
