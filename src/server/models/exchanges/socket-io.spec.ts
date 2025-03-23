import { buildSocketIoExchange } from './socket-io';

// Test generated using Keploy
test('should emit the correct event with payload', () => {
  const mockEmit = jest.fn();
  const io = { emit: mockEmit };
  const exchangeService = buildSocketIoExchange<any>(io);

  exchangeService.publish('testEvent', { key: 'value' });

  expect(mockEmit).toHaveBeenCalledWith('testEvent', { key: 'value' });
});

