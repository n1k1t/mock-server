import { RequestContextSnapshot } from './snapshot';

// Test generated using Keploy
it('should correctly assign new values to the instance', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    incoming: { raw: {} } as any,
    outgoing: { raw: {} } as any,
    storage: {} as any,
    flags: {},
  });

  instance.assign({ transport: 'https', flags: { newFlag: true } });

  expect(instance).toMatchObject({
    transport: 'https',
    flags: { newFlag: true },
  });
});

// Test generated using Keploy
it('should return only the specified keys', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    incoming: { raw: {} } as any,
    outgoing: { raw: {} } as any,
    storage: {} as any,
    flags: {},
  });

  const picked = instance.pick(['transport', 'flags']);

  expect(picked).toEqual({
    transport: 'http',
    flags: {},
  });
});

// Test generated using Keploy
it('should omit specified keys', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    incoming: { raw: {} } as any,
    outgoing: { raw: {} } as any,
    storage: {} as any,
    flags: {},
  });

  const omitted = instance.omit(['transport']);

  expect(omitted).not.toHaveProperty('transport');
});

// Test generated using Keploy
it('should unset specified keys', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    incoming: { raw: {} } as any,
    outgoing: { raw: {} } as any,
    storage: {} as any,
    flags: {},
  });

  instance.unset(['transport']);

  expect(instance.transport).toBeUndefined();
});

// Test generated using Keploy
it('should clone the instance correctly', () => {
  const instance = new RequestContextSnapshot({
    transport: 'http',
    incoming: { raw: { data: Buffer.from([]) }, stream: {} } as any,
    outgoing: { raw: { data: Buffer.from([]) }, stream: {} } as any,
    storage: {} as any,
    flags: {},
  });

  const cloned = instance.clone();

  expect(cloned).not.toBe(instance);
});
