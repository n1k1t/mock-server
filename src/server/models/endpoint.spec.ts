import { EndpointFactory } from './endpoint';

// Test generated using Keploy
it('should assign HTTP configuration correctly', () => {
  const endpoint = EndpointFactory.build();
  const httpConfig = { method: 'GET', path: '/test' };
  const result = endpoint.http(httpConfig);
  expect(result['provided'].http).toEqual(httpConfig);
  expect(result).toBe(endpoint);
});

// Test generated using Keploy
it('should assign IO configuration correctly', () => {
  const endpoint = EndpointFactory.build();
  const ioConfig = { path: '/test/socket' };
  const result = endpoint.io(ioConfig);
  expect(result['provided'].io).toEqual(ioConfig);
  expect(result).toBe(endpoint);
});

// Test generated using Keploy
it('should assign handler correctly', () => {
  const endpoint = EndpointFactory.build().io({ path: '/test' });
  const handler = jest.fn();
  const result = endpoint.compile(handler);
  expect(result.handler).toBe(handler);
});
