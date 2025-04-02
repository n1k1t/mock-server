import { Provider } from './model';

// Test generated using Keploy
describe('Provider', () => {
  it('should assign the server correctly', () => {
    const provider = Provider.build({ group: 'test-group' });
    const mockServer = {}; // Mock server object
    provider.assign({ server: <any>mockServer });
    expect(provider.server).toBe(mockServer);
  });
});
