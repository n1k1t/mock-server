import { Container } from './model';

// Test generated using Keploy
test('should initialize Container with correct properties', () => {
  const provided = {
    key: 'testKey',
    payload: { data: 'testData' },
    ttl: 100,
    timestamp: Date.now(),
    prefix: 'testPrefix',
    hooks: {
      onBind: jest.fn(),
      onUnbind: jest.fn(),
    },
  };
  const container = new Container(provided);
  expect(container.key).toBe('testPrefixtestKey');
  expect(container.payload).toEqual(provided.payload);
  expect(container.ttl).toBe(provided.ttl);
  expect(container.expiresAt).toBe(provided.timestamp + provided.ttl * 1000);
});

// Test generated using Keploy
test('should merge payload correctly', () => {
  const provided = {
    key: 'testKey',
    payload: { data: 'initialData' },
    ttl: 100,
    timestamp: Date.now(),
  };
  const container = new Container(provided);
  const merged = container.merge({ data: 'newData' });
  expect(merged.payload.data).toBe('newData');
});

// Test generated using Keploy
test('should assign new payload to Container', () => {
  const provided = {
    key: 'testKey',
    payload: { data: 'initialData' },
    ttl: 100,
    timestamp: Date.now(),
  };
  const container = new Container(provided);
  container.assign({ data: 'updatedData' });
  expect(container.payload.data).toBe('updatedData');
});

// Test generated using Keploy
test('should call onBind hook when binding', () => {
  const onBindMock = jest.fn();
  const provided = {
    key: 'testKey',
    payload: {},
    ttl: 100,
    timestamp: Date.now(),
    hooks: {
      onBind: onBindMock,
    },
  };
  const container = new Container(provided);
  container.bind('testLink');
  expect(onBindMock).toHaveBeenCalled();
});

// Test generated using Keploy
test('should call onUnbind hook when unbinding', () => {
  const onUnbindMock = jest.fn();
  const provided = {
    key: 'testKey',
    payload: {},
    ttl: 100,
    timestamp: Date.now(),
    hooks: {
      onUnbind: onUnbindMock,
    },
  };
  const container = new Container(provided);
  container.unbind();
  expect(onUnbindMock).toHaveBeenCalled();
});
