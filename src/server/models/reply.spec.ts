import { RequestContext } from './context';
import { Reply } from './reply';

// Test generated using Keploy
test('test_okMethod_shouldReturnStructuredResponse', () => {
  const mockContext = {} as RequestContext;
  const reply = new class extends Reply<typeof mockContext> {
    ok = (payload: unknown) => ({ status: 200, data: payload });
    notFound = () => ({ status: 404 });
    internalError = (message?: string) => ({ status: 500, message });
    validationError = (reasons?: unknown[]) => ({ status: 400, errors: reasons });
  }(mockContext);

  const response = reply.ok({ message: 'success' });
  expect(response).toEqual({ status: 200, data: { message: 'success' } });
  expect(typeof response).toBe('object');
});
