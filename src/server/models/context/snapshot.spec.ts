import { RequestContextSnapshot } from './snapshot';

// Test generated using Keploy
it('should correctly assign new values to the instance', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    event: 'connect',
    incoming: <any>{},
    outgoing: <any>{},
    storage: <any>{},
    flags: {}
  });

  instance.assign({ transport: 'https', flags: { newFlag: true } });

  expect(instance.transport).toBe('https');
  expect(instance.flags?.newFlag).toBe(true);
});

// Test generated using Keploy
it('should return only the specified keys', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    event: 'connect',
    incoming: <any>{},
    outgoing: <any>{},
    storage: <any>{},
    flags: {}
  });

  const picked = instance.pick(['transport', 'flags']);
  expect(picked).toEqual({
    transport: 'http',
    flags: {}
  });
});

// Test generated using Keploy
it('should omit specified keys', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    event: 'connect',
    incoming: <any>{},
    outgoing: <any>{},
    storage: <any>{},
    flags: {}
  });

  const omitted = instance.omit(<never[]>['transport']);
  expect(omitted.transport).toBeUndefined();
  expect(omitted.event).toBe('connect');
});

// Test generated using Keploy
it('should unset specified keys', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    event: 'connect',
    incoming: <any>{},
    outgoing: <any>{},
    storage: <any>{},
    flags: {}
  });

  instance.unset(['transport']);
  expect(instance.transport).toBeUndefined();
});

// Test generated using Keploy
it('should clone the instance correctly', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    event: 'connect',
    incoming: <any>{},
    outgoing: <any>{},
    storage: <any>{},
    flags: {}
  });

  const cloneInstance = instance.clone();
  expect(cloneInstance).not.toBe(instance);
  expect(cloneInstance.transport).toBe(instance.transport);
});

