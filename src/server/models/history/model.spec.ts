import { History } from './model';

// Test generated using Keploy
test('test_pushMessage_withValidData_messageAddedToSnapshot', () => {
  const history = new History({ group: 'testGroup', snapshot: <any>{ messages: [] } });
  const location = 'testLocation';
  const data = { key: 'value' };

  history.pushMessage(<any>location, data);

  expect(history.snapshot.messages.length).toBe(1);
  expect(history.snapshot.messages[0]).toEqual(
    expect.objectContaining({
      location: location,
      data: data
    })
  );
});

// Test generated using Keploy
test('test_switchStatus_updatesStatus', () => {
  const history = new History({ group: 'testGroup', snapshot: <any>{ messages: [] } });
  history.switchStatus('completed');
  expect(history.hasStatus('completed')).toBe(true);
});

// Test generated using Keploy
test('test_complete_marksStatusCompletedAndClonesContainer', () => {
  const mockContainer = { clone: jest.fn() };
  const history = new History({ group: 'testGroup', snapshot: <any>{ messages: [], container: mockContainer } });
  history.complete();
  expect(history.hasStatus('completed')).toBe(true);
  expect(mockContainer.clone).toHaveBeenCalled();
});

