import { IRequestContextIncoming } from '../../context';

export class ExecutorManualError extends Error {
  constructor(public code: Extract<IRequestContextIncoming['error'], string>) {
    super(`Executor manual error [${code}]`);
  }

  public is<K extends Extract<IRequestContextIncoming['error'], string>>(code: K): this is this & { code: K } {
    return this.code === code;
  }

  static build(code: Extract<IRequestContextIncoming['error'], string>) {
    return new ExecutorManualError(code);
  }
}
