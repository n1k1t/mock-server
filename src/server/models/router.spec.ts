import { Router } from './router';

// Test generated using Keploy
test('should set default transports when no transports are provided', () => {
  const mockServer = {
    providers: {
      register: jest.fn(),
      default: {} // mocked default provider
    },
    transports: new Map([['default', {}]]) // mocked transports
  };

  const router = new Router(<any>mockServer);
  const pattern = 'route-pattern';
  const configuration = { provider: {} }; // mocked provider

  const result = router.register(pattern, <any>configuration);

  expect(mockServer.providers.register).toHaveBeenCalledWith(configuration.provider);
  expect(result.get(pattern)).toEqual({
    provider: configuration.provider,
    transports: { default: {} } // default transport set
  });
});

// Test generated using Keploy
test('match should yield default provider and transport for non-matching pattern', () => {
  const mockServer = {
    providers: {
      register: jest.fn(),
      default: {} // mocked default provider
    },
    transports: new Map([['transport2', {}]]) // mocked transports
  };
  const router = new Router(<any>mockServer);
  const pattern = 'route/*';
  const configuration = {
    provider: {},
    transports: ['transport1']
  };
  router.register(pattern, <any>configuration);

  const result = Array.from(router.match('transport2', 'random/path'));
  expect(result).toHaveLength(1);
  expect(result[0]).toEqual({
    provider: mockServer.providers.default,
    transport: {}
  });
});

