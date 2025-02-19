import type { RequestContext } from './request-context';

export abstract class Reply<TContext extends RequestContext, TOutgoing = unknown> {
  constructor(public context: TContext) {}

  public abstract ok(payload: TOutgoing): unknown;
  public abstract notFound(): unknown;
  public abstract internalError(message?: string): unknown;
  public abstract validationError(reasons?: unknown[]): unknown;
}
