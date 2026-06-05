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
  is: jest.fn(() => true),
  switch: jest.fn().mockReturnThis(),
  actualize: jest.fn().mockReturnThis(),
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
  is: jest.fn(() => true),
  snapshot: {
    messages: [],
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
  schema: {
    forward: null,
  },
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
        },
      },
      server: {
        exchanges: {
          io: { publish: jest.fn() },
        },
        services: {
          metrics: { register: jest.fn() },
        },
      },
    },
    snapshot: {},
  };

  const executor = new TestExecutor();
  const result = await executor.exec(context);

  expect(result).toBe(context);
  expect(context.provider.storages.history.unregister).toHaveBeenCalled();
});

// Test generated using Keploy
it('test_exec_expectationMatched_updatesContext', async () => {
  const mockExpectation = {
    request: {
      manipulate: jest.fn((snapshot) => Object.assign(snapshot, { manipulated: true })),
    },
    increaseExecutionsCounter: jest.fn().mockReturnThis(),
    toPlain: jest.fn(),
    name: 'TestExpectation',
    id: 'exp123',
  };

  const context = {
    provider: {
      storages: {
        expectations: { match: jest.fn().mockResolvedValue(mockExpectation) },
        history: { unregister: jest.fn() },
      },
      server: {
        exchanges: { io: { publish: jest.fn() } },
        services: { metrics: { register: jest.fn() } },
      },
    },
    assign: jest.fn(),
    snapshot: { messages: [] },
    history: { is: jest.fn(() => false), switch: jest.fn() },
    is: jest.fn().mockReturnValue(false),
    streams: {
      incoming: { subscribe: jest.fn() },
      outgoing: { subscribe: jest.fn() },
    },
  };
  const executor = new TestExecutor();

  await executor.exec(context as any);

  expect(context.assign).toHaveBeenCalledWith({
    snapshot: expect.objectContaining({ manipulated: true }),
    expectation: mockExpectation,
  });
});

// Test generated using Keploy
it('test_exec_withForwardingEnabled_handlingForward', async () => {
  const mockExpectation = {
    request: { manipulate: jest.fn((snapshot) => Object.assign(snapshot, { manipulated: true })) },
    increaseExecutionsCounter: jest.fn().mockReturnThis(),
    toPlain: jest.fn(),
    name: 'TestExpectation',
    id: 'exp123',
    schema: { forward: { isEnabled: true } },
  };
  const context = {
    provider: {
      storages: {
        expectations: { match: jest.fn().mockResolvedValue(mockExpectation) },
        history: { unregister: jest.fn() },
      },
      server: {
        exchanges: { io: { publish: jest.fn() } },
        services: { metrics: { register: jest.fn() } },
      },
    },
    assign: jest.fn(),
    snapshot: {
      incoming: {},
      outgoing: {},
      assign: jest.fn().mockReturnThis(),
      forwarded: {},
      messages: [],
    },
    history: { is: jest.fn(() => false), switch: jest.fn() },
    is: jest.fn().mockReturnValue(true),
    streams: {
      incoming: { subscribe: jest.fn() },
      outgoing: { subscribe: jest.fn() },
    },
    compileCacheConfiguration: jest.fn(() => ({ isEnabled: false })),
  };
  const executor = new TestExecutor();
  jest.spyOn(executor as any, 'handleForwarding').mockResolvedValue({
    schema: { isEnabled: true },
    incoming: {},
    outgoing: { content: 'forwarded' },
  });

  await executor.exec(context as any);

  expect(context.snapshot.assign).toHaveBeenCalledWith(
    expect.objectContaining({
      outgoing: { content: 'forwarded' },
    }),
  );
});

/* Generated by @n1k1t/unit-generator */
it('should unregister history and return context when no expectation and no outgoing', async () => {
  class MockHistory {
    unregister = jest.fn();
    is = jest.fn();
    switch = jest.fn(() => this);
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
    is = jest.fn(() => true);
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
  expect(context.history.switch).not.toHaveBeenCalled();
});

/* Generated by @n1k1t/unit-generator */
it('should switch history status to pending when no expectation and history is registered', async () => {
  class MockHistory {
    unregister = jest.fn();
    is = jest.fn();
    switch = jest.fn(() => this);
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
    is = jest.fn(() => true);
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
  context.history.is.mockReturnValue(true);

  const result = await executor.exec(<any>context);

  expect(executor.match).toHaveBeenCalledWith(context);
  expect(context.provider.storages.history.unregister).not.toHaveBeenCalled();
  expect(context.history.is).toHaveBeenCalledWith('registered');
  expect(context.history.switch).toHaveBeenCalledWith('pending');
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
it("should return context early if not in 'handling' status after expectation match", async () => {
  const mockExpectation = createMockExpectation();
  const context = createMockRequestContext({
    is: jest.fn(() => false),
    streams: {
      incoming: { subscribe: jest.fn() },
      outgoing: { subscribe: jest.fn() },
    },
  });
  context.snapshot.messages = [];
  context.provider.storages.expectations.match.mockResolvedValue(mockExpectation);
  const executor = new ConcreteExecutor();

  const result = await executor.exec(context as any);

  expect(result).toBe(context);
});
