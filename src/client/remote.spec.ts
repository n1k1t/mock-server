import { RemoteClient } from './remote';

// Test generated using Keploy
it('should initialize the axios instance with correct baseURL and timeout', () => {
  const options = { baseUrl: 'http://localhost', timeout: 5000 };
  const client = new RemoteClient(options);
  expect(client['options'].baseUrl).toEqual('http://localhost');
  expect(client['options'].timeout).toEqual(5000);
});

// Test generated using Keploy
it('should throw an error when pinging fails', async () => {
  const options = { baseUrl: 'http://invalidurl', timeout: 5000 };
  await expect(RemoteClient.connect(options)).rejects.toThrow();
});
