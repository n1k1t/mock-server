declare global {
  type TFunction<T = unknown, U extends unknown[] = unknown[]> = (...args: U) => T;
  type Constructable<T, U extends any[] = any[]> = new (...args: U) => T;
  type KeyOfUnion<T> = T extends T ? keyof T: never;

  type SetNonNullableKeys<T extends object, U extends keyof T = keyof T> = T & { [K in U]-?: NonNullable<T[K]> };
  type SetRequiredKeys<T extends object, U extends keyof T = keyof T> = T & { [K in U]-?: T[K] };
  type SetPartialKeys<T extends object, U extends keyof T = keyof T> = Omit<T, U> & { [K in U]?: T[K] };

  type OmitNeverKeys<T extends object> = Pick<T, ExtractKeysWithoutType<T, never>>;
  type OmitPartial<T extends object> = OmitNeverKeys<{ [K in keyof T]-?: {} extends Pick<T, K> ? never : K }>;
  type OmitRequired<T extends object> = OmitNeverKeys<{ [K in keyof T]-?: {} extends Pick<T, K> ? K : never }>;

  type PickWithType<T extends object, U> = Pick<T, ExtractKeysWithType<T, U>>;
  type PickRequiredByKeys<T extends object, U extends keyof T = keyof T> = T & { [K in U]-?: Pick<T, K> };

  type CheckKeyIsRequired<T extends object, K extends keyof T> =
    keyof T extends never
      ? false
      : ExtractRequiredKeys<Pick<T, K>> extends never
      ? false
      : true;

  type CheckKeyIsPartial<T extends object, K extends keyof T> =
    keyof T extends never
      ? false
      : ExtractPartialKeys<Pick<T, K>> extends never
      ? false
      : true;

  type ConvertToInstanceType<T> = T extends Constructable<unknown> ? InstanceType<T> : T;
  type ConvertTupleToUnion<T extends readonly unknown[]> = T[number];

  type ConvertUndefinedKeysToOptionals<T extends object> =
    ExtractKeysWithType<T, undefined> extends never ? T : SetPartialKeys<T, ExtractKeysWithType<T, undefined>>;

  type ConvertUnionToTuple<
    T,
    U = T extends never ? never : (arg: T) => T,
    Q = (U extends never ? never : (arg: U) => never) extends (arg: infer I) => void ? I : never
  > = Q extends (arg: never) => infer R ? [...ConvertUnionToTuple<Exclude<T, R>>, R] : [];

  type ExtractPartialKeys<T extends object> = keyof OmitRequired<T>;
  type ExtractRequiredKeys<T extends object> = keyof OmitPartial<T>;

  type ExtractKeysWithType<T extends object, U, Q extends keyof T = keyof T> = {
    [K in Q]-?: Extract<T[K], U> extends never ? never : K;
  }[Q];

  type ExtractKeysWithoutType<T extends object, U, Q extends keyof T = keyof T> = {
    [K in Q]-?: T[K] extends U ? never : K;
  }[Q];

  /**
   * Extracts parameters and return type of class method to tuple `[T, U[]]`
   * where `T` is return type and `U[]` is parameters
   *
   * @example
   * ```ts
   * class Test {
   *   static build(type: string): Promise<object> {...}
   *   public hasType(type: string): boolean {...}
   * }
   *
   * type TTestBuildMethodContext = ExtractClassMethodContext<typeof Test, 'build'>;
   * // => [Promise<object>, [string]]
   *
   * type TTestHasTypeMethodContext = ExtractClassMethodContext<typeof Test, 'hasType'>;
   * // => [boolean, [string]]
   * ```
   */
  type ExtractClassMethodContext<T extends Constructable<object>, K extends keyof T | keyof InstanceType<T>> = (
    K extends keyof T ? T[K] : K extends keyof InstanceType<T> ? InstanceType<T>[K] : never
  ) extends TFunction<infer R0, infer R1>
    ? [R0, R1]
    : never;

  type MergeObjectsCouple<T1 extends object, T2 extends object> = keyof T2 extends never
    ? T1
    : Omit<T1, keyof T2> & T2;

  type MergeClassesCouple<
    T1 extends Constructable<object>,
    T2 extends Constructable<object>,
  > = keyof InstanceType<T2> extends never
    ? keyof T2 extends never
      ? T1
      : Omit<T1, keyof T2> & T2
    : Omit<T1, keyof T2> & Constructable<Omit<InstanceType<T1>, keyof InstanceType<T2>>> & T2;

  type MergeClassesTuple<
    T extends readonly Constructable<object>[],
  > = T extends readonly [infer R0, ...infer RN]
    ? R0 extends Constructable<object>
      ? RN extends readonly Constructable<object>[]
        ? MergeClassesCouple<R0, MergeClassesTuple<RN>>
        : R0
      : Constructable<{}>
    : Constructable<{}>;

  type PartialDeep<T extends object> = {
    [K in keyof T]?: Extract<T[K], object> extends never
      ? T[K]
      : PartialDeep<Extract<T[K], object>> | Exclude<T[K], object>;
  };

  type FlattenArrays<T extends unknown[][]> = [
    ...(T extends Array<infer R> ? R extends unknown[][] ? FlattenArrays<R> : R : T)
  ];
}

export {};
