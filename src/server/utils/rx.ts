import { Observable } from 'rxjs';

export class RxConverter<T> {
  constructor(public source: Observable<T>) {}

  public iterate(): AsyncIterable<T, null> {
    const state = { isCompleted: false };

    const errors: Error[] = [];
    const buffer: T[] = [];

    this.source.subscribe({
      complete: () => state.isCompleted = true,
      error: (error) => errors.push(error),
      next: (payload) => buffer.push(payload),
    });

    const next = async (): Promise<IteratorResult<T, null>> => {
      if (errors.length) {
        throw errors.shift();
      }
      if (buffer.length) {
        return { value: buffer.shift()!, done: false };
      }
      if (state.isCompleted) {
        return { value: null, done: true };
      }

      await new Promise<void>((resolve, reject) => this.source.subscribe({
        complete: () => resolve(),
        error: (error) => reject(error),
        next: () => resolve(),
      }));

      return next();
    };

    return {
      [Symbol.asyncIterator]: () => ({ next })
    };
  }

  static build<T>(source: Observable<T>): RxConverter<T> {
    return new RxConverter(source);
  }
}
