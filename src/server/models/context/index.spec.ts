import { IRequestContextIncoming, RequestContext } from './index';

class TestRequestContext extends RequestContext {
  public incoming: IRequestContextIncoming = {
    type: 'plain',
    path: '/',
    method: 'NONE',
    headers: {},
  };

  public snapshot = this.compileSnapshot();
}

// Test generated using Keploy
test('switchStatus method should correctly change status and return the instance', () => {
  const providerMock = { storages: { containers: {}, history: { register: jest.fn() } }, server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } } };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  const result = context.switch('handling');
  expect(context.status).toBe('handling');
  expect(result).toBe(context);
});


// Test generated using Keploy
test('compileSnapshot method should create a valid snapshot with proper properties', () => {
  const providerMock = { storages: { containers: {}, history: { register: jest.fn() } }, server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } } };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.incoming = <any>{ type: 'testType' };

  const snapshot = context.compileSnapshot();

  expect(snapshot.transport).toBe(context.transport);
  expect(snapshot.event).toBe(context.event);
  expect(snapshot.flags).toEqual(context.flags);
  expect(snapshot.incoming).toEqual(context.incoming);
  expect(snapshot.outgoing.stream).toBeDefined();
  expect(snapshot.incoming.stream).toBeDefined();
});


// Test generated using Keploy
test('compileHistory method should register history with the correct snapshot', () => {
  const providerMock = {
    storages: {
      containers: {},
      history: {
        register: jest.fn().mockReturnValue({})
      }
    },
    server: {
      databases: { redis: {} },
      exchanges: { io: { publish: jest.fn() } }
    }
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.incoming = <any>{ type: 'testType' };
  const history = context.compileHistory();

  expect(providerMock.storages.history.register).toHaveBeenCalledWith(expect.objectContaining({
    timestamp: context.timestamp,
    snapshot: expect.anything()
  }));
  expect(history).toBe((<jest.Mock>context.provider.storages.history.register).mock.results[0].value);
});


// Test generated using Keploy
test('compileCacheConfiguration returns disabled when cache is not enabled or expectation is missing', () => {
  const providerMock = {
    storages: { containers: {} },
    server: {
      databases: { redis: null },
      exchanges: { io: { publish: jest.fn() } }
    }
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.snapshot = <any>{
    cache: { isEnabled: false },
    incoming: { type: 'GET' },
    outgoing: {}
  };

  const result = context.compileCacheConfiguration();

  expect(result).toEqual({ isEnabled: false });
});


// Test generated using Keploy
test('hasStatuses method correctly identifies if current status is in the given list', () => {
  const providerMock = {
    storages: { containers: {}, history: { register: jest.fn() } },
    server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } }
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.switch('completed');

  const result = context.is(['registered', 'completed']);

  expect(result).toBe(true);
});


// Test generated using Keploy
test('complete method completes streams and switches status to completed', () => {
  const providerMock = {
    storages: {
      containers: {},
      history: { register: jest.fn() }
    },
    server: {
      databases: { redis: {} },
      exchanges: { io: { publish: jest.fn() } }
    }
  };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  context.incoming = <any>{ type: 'testType' };
  context.snapshot = <any>{
    outgoing: {}
  };
  context.complete();

  expect(context.is(['completed'])).toBe(true);
  expect(context.streams.incoming.isStopped).toBe(true);
  expect(context.streams.outgoing.isStopped).toBe(true);
});

// Test generated using Keploy
test('assign method correctly assigns properties to the context', () => {
  const providerMock = { storages: { containers: {}, history: { register: jest.fn() } }, server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } } };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);
  const payload = <any>{ incoming: { type: 'newType' }, outgoing: { type: 'newOutgoing' } };

  context.assign(payload);

  expect(context.incoming).toEqual(payload.incoming);
  expect(context.outgoing).toEqual(payload.outgoing);
});


// Test generated using Keploy
test('skip method switches status to skipped', () => {
  const providerMock = { storages: { containers: {}, history: { register: jest.fn() } }, server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } } };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);

  context.skip();

  expect(context.status).toBe('skipped');
});


// Test generated using Keploy
test('handle method switches status to handling', () => {
  const providerMock = { storages: { containers: {}, history: { register: jest.fn() } }, server: { databases: { redis: {} }, exchanges: { io: { publish: jest.fn() } } } };
  const configurationMock = { transport: '', event: '' };
  const context = new TestRequestContext(<any>providerMock, configurationMock);

  context.handle();

  expect(context.status).toBe('handling');
});


