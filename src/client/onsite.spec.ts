import { OnsiteClient } from './onsite';

// Test generated using Keploy
test('updateExpectationsGroup(validInput) should return array of expectations', async () => {
  const provider = {}; // Mock provider
  const client = new OnsiteClient(<any>provider);
  const mockExpectationsResponse = [{ id: 1, name: 'Expectation 1' }];
  client['methods'] = <any>{
    updateExpectationsGroup: jest.fn().mockResolvedValue(mockExpectationsResponse),
  };

  const body = { set: [{ someKey: 'someValue' }] };
  const result = await client.updateExpectationsGroup(<any>body);
  expect(result).toEqual(mockExpectationsResponse);
  expect(client['methods'].updateExpectationsGroup).toHaveBeenCalledWith({ set: body });
});

// Test generated using Keploy
test('build(provider) should return an instance of OnsiteClient', () => {
  const provider = {}; // Mock provider
  const clientInstance = OnsiteClient.build(<any>provider);
  expect(clientInstance).toBeInstanceOf(OnsiteClient);
});
