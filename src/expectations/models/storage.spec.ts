import { buildExpectationContext } from '../__utils__';
import { ExpectationsStorage } from './storage'
import { Expectation } from './expectation';

describe('Expectations.Models.Storage', () => {
  it('should not match with empty storage', () => {
    const storage = new ExpectationsStorage();
    expect(storage.match(buildExpectationContext())).toBeNull();
  });

  it('should match with 1 expectation', () => {
    const storage = new ExpectationsStorage();

    const { expectation } = <{ expectation: Expectation }>storage.register({
      schema: {
        request: { $has: { $location: 'path', $value: '/foo/bar/baz' } },
      },
    });

    expect(storage.match(buildExpectationContext())?.id).toEqual(expectation.id);
  });

  it('should not match with 1 expectation', () => {
    const storage = new ExpectationsStorage();

    storage.register({
      schema: {
        request: { $has: { $location: 'path', $value: '/foo' } },
      },
    });

    expect(storage.match(buildExpectationContext())).toBeNull();
  });

  it('should match with 2 expectations', () => {
    const storage = new ExpectationsStorage();

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

    expect(storage.match(buildExpectationContext())?.id).toEqual(expectation.id);
  });

  it('should not match with 2 expectations', () => {
    const storage = new ExpectationsStorage();

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

    expect(storage.match(buildExpectationContext())).toBeNull();
  });
});
