import { Executor } from './index';

// Test generated using Keploy
class TestExecutor extends Executor<any> {
  forward() {
    return Promise.resolve(null);
  }

  reply() {
    return Promise.resolve(null);
  }
}

test('test_exec_noExpectationNoOutgoing_unregistersHistory', async () => {
  const context = {
    provider: {
      storages: {
        expectations: {
          match: jest.fn().mockResolvedValue(null),
        },
        history: {
          unregister: jest.fn(),
        }
      },
      server: {
        exchanges: {
          io: { publish: jest.fn() }
        },
        services: {
          metrics: { register: jest.fn() }
        }
      }
    },
    snapshot: {},
    hasStatuses: jest.fn().mockReturnValue(false)
  };

  const executor = new TestExecutor();
  const result = await executor.exec(context);

  expect(result).toBe(context);
  expect(context.provider.storages.history.unregister).toHaveBeenCalled();
});

// Test generated using Keploy
test('test_exec_expectationMatched_updatesContext', async () => {
  const mockExpectation = <any>{
    request: {
      manipulate: jest.fn((snapshot) => Object.assign(snapshot, { manipulated: true })),
    },
    increaseExecutionsCounter: jest.fn(() => mockExpectation),
    toPlain: jest.fn(),
    name: 'TestExpectation',
    id: 'exp123',
  };

  const context = {
    provider: {
      storages: {
        expectations: {
          match: jest.fn().mockResolvedValue(mockExpectation),
        },
        history: {
          unregister: jest.fn(),
        }
      },
      server: {
        exchanges: {
          io: { publish: jest.fn() }
        },
        services: {
          metrics: { register: jest.fn() }
        }
      }
    },
    assign: jest.fn(),
    snapshot: {},
    history: {
      hasStatus: jest.fn(() => false),
      switchStatus: jest.fn(),
    },
    hasStatuses: jest.fn().mockReturnValue(false)
  };

  const executor = new TestExecutor();
  const result = await executor.exec(context);

  expect(result).toBe(context);
  expect(context.assign).toHaveBeenCalledWith({
    snapshot: { manipulated: true },
    expectation: mockExpectation
  });
  expect(mockExpectation.increaseExecutionsCounter).toHaveBeenCalled();
  expect(context.provider.server.exchanges.io.publish)
    .toHaveBeenCalledWith('expectation:updated', mockExpectation.toPlain());
});

// Test generated using Keploy
test('test_exec_withForwardingEnabled_handlingForward', async () => {
  const mockExpectation = <any>{
    request: { manipulate: jest.fn((snapshot) => Object.assign(snapshot, { manipulated: true })) },
    increaseExecutionsCounter: jest.fn(() => mockExpectation),
    toPlain: jest.fn(),
    name: 'TestExpectation',
    id: 'exp123',
    forward: true,
  };

  const context = {
    provider: {
      storages: {
        expectations: {
          match: jest.fn().mockResolvedValue(mockExpectation),
        },
        history: {
          unregister: jest.fn(),
        }
      },
      server: {
        exchanges: {
          io: { publish: jest.fn() }
        },
        services: {
          metrics: { register: jest.fn() }
        }
      }
    },
    assign: jest.fn(),
    snapshot: { incoming: {}, outgoing: {}, assign: jest.fn(), forwarded: {} },
    history: {
      hasStatus: jest.fn(() => false),
      switchStatus: jest.fn(),
    },
    hasStatuses: jest.fn().mockReturnValue(true)
  };

  const handleForwardingMock = jest.spyOn(TestExecutor.prototype, <never>'handleForwarding');
  handleForwardingMock.mockResolvedValueOnce(<never>{ outgoing: { content: "forwarded" } });

  const executor = new TestExecutor();
  await executor.exec(context);

  expect(handleForwardingMock).toHaveBeenCalled();
  expect(context.snapshot.assign).toHaveBeenCalledWith({
    outgoing: { content: "forwarded" },
    forwarded: expect.any(Object),
  });
});


