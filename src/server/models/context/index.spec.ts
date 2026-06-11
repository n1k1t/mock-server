import { IRequestContextIncoming, RequestContext } from './index';

class TestRequestContext extends RequestContext {
  public incoming: IRequestContextIncoming = {
    type: 'plain',
    path: '/',
    method: 'NONE',

    headers: {},
    query: {},
    raw: {},
  };

  public snapshot = this.compileSnapshot();
}

// Test generated using Keploy
it('switchStatus method should correctly change status and return the instance', () => {
  const providerMock = {
    storages: { containers: {}, history: { register: jest.fn() } },
    server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);

  expect(context.switch('handling')).toBe(context);
});

// Test generated using Keploy
it('compileSnapshot method should create a valid snapshot with proper properties', () => {
  const providerMock = {
    storages: { containers: {}, history: { register: jest.fn() } },
    server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.incoming = <any>{ type: 'testType', raw: {} };

  expect(context.compileSnapshot()).toMatchObject({
    transport: context.transport,
    flags: context.flags,
    incoming: context.incoming,
  });
});

// Test generated using Keploy
it('compileHistory method should register history with the correct snapshot', () => {
  const providerMock = {
    storages: {
      containers: {},
      history: {
        register: jest.fn().mockReturnValue({}),
      },
    },
    server: {
      databases: { redis: {} },
      exchanges: { io: { publish: jest.fn() } },
    },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.incoming = <any>{ type: 'testType', raw: {} };

  context.compileHistory();

  expect(providerMock.storages.history.register).toHaveBeenCalledWith(
    expect.objectContaining({ timestamp: context.timestamp }),
  );
});

// Test generated using Keploy
it('compileCacheConfiguration returns disabled when cache is not enabled or expectation is missing', () => {
  const providerMock = {
    storages: { containers: {} },
    server: {
      databases: { redis: null },
      exchanges: { io: { publish: jest.fn() } },
    },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.snapshot = <any>{
    cache: { isEnabled: false },
    incoming: { type: 'GET' },
    outgoing: {},
  };

  expect(context.compileCacheConfiguration()).toEqual({ isEnabled: false });
});

// Test generated using Keploy
it('hasStatuses method correctly identifies if current status is in the given list', () => {
  const providerMock = {
    storages: { containers: {}, history: { register: jest.fn() } },
    server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.switch('completed');

  expect(context.is(['registered', 'completed'])).toBe(true);
});

// Test generated using Keploy
it('complete method completes streams and switches status to completed', () => {
  const providerMock = {
    storages: {
      containers: {},
      history: { register: jest.fn() },
    },
    server: {
      databases: { redis: {} },
      exchanges: { io: { publish: jest.fn() } },
    },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.incoming = <any>{ type: 'testType', raw: {} };
  context.snapshot = <any>{
    outgoing: {},
  };

  expect(context.complete().status).toBe('completed');
});

// Test generated using Keploy
it('assign method correctly assigns properties to the context', () => {
  const providerMock = {
    storages: { containers: {}, history: { register: jest.fn() } },
    server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  const payload = <any>{ incoming: { type: 'newType', raw: {} }, outgoing: { type: 'newOutgoing', raw: {} } };

  expect(context.assign(payload)).toMatchObject(payload);
});

// Test generated using Keploy
it('skip method switches status to skipped', () => {
  const providerMock = {
    storages: { containers: {}, history: { register: jest.fn() } },
    server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);

  expect(context.skip().status).toBe('skipped');
});

// Test generated using Keploy
it('handle method switches status to handling', () => {
  const providerMock = {
    storages: { containers: {}, history: { register: jest.fn() } },
    server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } },
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);

  expect(context.handle().status).toBe('handling');
});
