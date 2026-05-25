import { buildExpectationContext } from '../__utils__';
import { ExpectationsStorage } from './storage'
import { Expectation } from './expectation';

it('should not match with empty storage', async () => {
  const storage = new ExpectationsStorage({ group: 'test' });

  expect(await storage.match(buildExpectationContext())).toBeNull();
});

it('should match with 1 expectation', async () => {
  const storage = new ExpectationsStorage({ group: 'test' });
  const { expectation } = <{ expectation: Expectation }>storage.register({
    schema: {
      request: { $has: { $location: 'path', $value: '/foo/bar/baz' } },
    },
  });

  expect((await storage.match(buildExpectationContext()))?.id).toEqual(expectation.id);
});

it('should not match with 1 expectation', async () => {
  const storage = new ExpectationsStorage({ group: 'test' });
  storage.register({
    schema: {
      request: { $has: { $location: 'path', $value: '/foo' } },
    },
  });

  expect(await storage.match(buildExpectationContext())).toBeNull();
});

it('should match with 2 expectations', async () => {
  const storage = new ExpectationsStorage({ group: 'test' });
  storage.register({
    schema: {
      request: { $has: { $location: 'path', $value: '/foo/bar' } },
    },
  });
  const { expectation } = <{ expectation: Expectation }>storage.register({
    schema: {
      request: { $has: { $location: 'method', $valueAnyOf: ['GET', 'POST'] } },
    },
  });

  expect((await storage.match(buildExpectationContext()))?.id).toEqual(expectation.id);
});

it('should not match with 2 expectations', async () => {
  const storage = new ExpectationsStorage({ group: 'test' });
  storage.register({
    schema: {
      request: { $has: { $location: 'path', $value: '/foo/bar' } },
    },
  });
  storage.register({
    schema: {
      request: { $has: { $location: 'method', $valueAnyOf: ['GET'] } },
    },
  });

  expect(await storage.match(buildExpectationContext())).toBeNull();
});
