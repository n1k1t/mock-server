import type { Executor } from '../executor';
import type { Provider } from '../providers';

export abstract class Transport<TExecutor extends Executor = Executor> {
  public TContext!: TExecutor['TContext'];

  public abstract executor: TExecutor;
  public abstract compileContext(provider: Provider<any>, ...args: unknown[]): Promise<TExecutor['TRequestContext']>;
}
