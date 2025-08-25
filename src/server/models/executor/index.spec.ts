import { Executor } from './index';

class TestExecutor extends Executor<any> {
  forward() {
    return Promise.resolve(null);
  }

  reply() {
    return Promise.resolve(null);
  }
}

const mockHistory = {
  hasStatus: jest.fn(() => true),
  switchStatus: jest.fn().mockReturnThis(),
  actualizeSnapshot: jest.fn().mockReturnThis(),
  assign: jest.fn().mockReturnThis(),
  toPlain: jest.fn(() => ({})),
};

const createMockRequestContext = (overrides = {}) => ({
  provider: {
    storages: {
      expectations: {
        match: jest.fn(),
      },
      history: {
        unregister: jest.fn(),
      },
    },
    server: {
      exchanges: {
        io: {
          publish: jest.fn(),
        },
      },
      services: {
        metrics: {
          register: jest.fn(),
        },
      },
    },
  },
  history: mockHistory,
  outgoing: null,
  hasStatuses: jest.fn(() => true),
  snapshot: {
    incoming: {
      delay: undefined,
      error: undefined,
    },
    assign: jest.fn().mockReturnThis(),
  },
  assign: jest.fn().mockReturnThis(),
  expectation: null,
  compileCacheConfiguration: jest.fn(() => ({ isEnabled: false })),
  pick: jest.fn(() => ({})),
  ...overrides,
});

const createMockExpectation = (overrides = {}) => ({
  id: 'some-id',
  name: 'some-name',
  request: {
    manipulate: jest.fn((snapshot) => snapshot),
  },
  response: {
    manipulate: jest.fn((snapshot) => snapshot),
  },
  increaseExecutionsCounter: jest.fn().mockReturnThis(),
  toPlain: jest.fn(() => ({})),
  forward: null,
  ...overrides,
});

class ConcreteExecutor extends Executor {
  forward = jest.fn(async () => null);
  reply = jest.fn(async () => null);
}

// Test generated using Keploy
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

/* Generated by @n1k1t/unit-generator */
it('should unregister history and return context when no expectation and no outgoing', async () => {
  class MockHistory {
    unregister = jest.fn();
    hasStatus = jest.fn();
    switchStatus = jest.fn(() => this);
  }

  class MockStorages {
    history = new MockHistory();
    expectations = {
      match: jest.fn(),
    };
  }

  class MockProvider {
    storages = new MockStorages();
  }

  class MockRequestContext {
    provider = new MockProvider();
    history = new MockHistory();
    outgoing: any = undefined;
    snapshot = <any>{
      incoming: {},
      assign: jest.fn(() => this.snapshot),
    };
    assign = jest.fn(() => this);
    hasStatuses = jest.fn(() => true);
    expectation: any = null;
  }

  class TestExecutor extends Executor {
    forward = jest.fn();
    reply = jest.fn();
  }

  const executor = new TestExecutor();
  const context = new MockRequestContext();

  executor.match = jest.fn().mockResolvedValue(null);
  context.outgoing = undefined;

  const result = await executor.exec(<any>context);

  expect(executor.match).toHaveBeenCalledWith(context);
  expect(context.provider.storages.history.unregister).toHaveBeenCalledWith(context.history);
  expect(result).toBe(context);
  expect(context.history.switchStatus).not.toHaveBeenCalled();
});

/* Generated by @n1k1t/unit-generator */
it('should switch history status to pending when no expectation and history is registered', async () => {
  class MockHistory {
    unregister = jest.fn();
    hasStatus = jest.fn();
    switchStatus = jest.fn(() => this);
  }

  class MockStorages {
    history = new MockHistory();
    expectations = {
      match: jest.fn(),
    };
  }

  class MockProvider {
    storages = new MockStorages();
  }

  class MockRequestContext {
    provider = new MockProvider();
    history = new MockHistory();
    outgoing: any = undefined;
    snapshot = <any>{
      incoming: {},
      assign: jest.fn(() => this.snapshot),
    };
    assign = jest.fn(() => this);
    hasStatuses = jest.fn(() => true);
    expectation: any = null;
  }

  class TestExecutor extends Executor {
    forward = jest.fn();
    reply = jest.fn();
  }

  const executor = new TestExecutor();
  const context = new MockRequestContext();

  executor.match = jest.fn().mockResolvedValue(null);
  context.outgoing = {};
  context.history.hasStatus.mockReturnValue(true);

  const result = await executor.exec(<any>context);

  expect(executor.match).toHaveBeenCalledWith(context);
  expect(context.provider.storages.history.unregister).not.toHaveBeenCalled();
  expect(context.history.hasStatus).toHaveBeenCalledWith('registered');
  expect(context.history.switchStatus).toHaveBeenCalledWith('pending');
  expect(result).toBe(context);
});

/* Generated by @n1k1t/unit-generator */
it('should unregister history and return context if no expectation and no outgoing', async () => {
  const context = createMockRequestContext({ outgoing: null });
  context.provider.storages.expectations.match.mockResolvedValue(null);

  const executor = new ConcreteExecutor();

  const result = await executor.exec(<any>context);

  expect(context.provider.storages.history.unregister).toHaveBeenCalledWith(context.history);
  expect(result).toBe(context);
});

/* Generated by @n1k1t/unit-generator */
it('should return context early if not in \'handling\' status after expectation match', async () => {
  const mockExpectation = createMockExpectation();
  const context = createMockRequestContext({
    hasStatuses: jest.fn(() => false),
  });
  context.provider.storages.expectations.match.mockResolvedValue(mockExpectation);

  const executor = new ConcreteExecutor();

  const result = await executor.exec(<any>context);

  expect(context.hasStatuses).toHaveBeenCalledWith(['handling']);
  expect(result).toBe(context);
  expect(executor.forward).not.toHaveBeenCalled();
  expect(executor.reply).not.toHaveBeenCalled();
});
