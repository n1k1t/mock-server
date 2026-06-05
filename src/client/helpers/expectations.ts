import type { TFunction } from '../../../types';
import type {
  ExtractExpectationContextValue,
  IExpectationSchemaContext,
  IExpectationSchemaInput,
  TExpectationOperatorLocation,
  TExpectationOperatorObjectLocation,
} from '../../expectations';

import type * as operators from '../../expectations/operators';

export interface ICompiledExpectationOperators<TContext extends IExpectationSchemaContext<any>> {
  not<S extends operators.$not<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): object;
  and<S extends operators.$and<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): object;
  or<S extends operators.$or<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): object;

  exec<S extends operators.$exec<TContext>['TSchema']>(command: S): object;
  if<S extends operators.$if<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): object;

  switch<
    K extends TExpectationOperatorLocation,
    S extends operators.$switch<TContext, TExpectationOperatorLocation, void, TExpectationOperatorLocation, any>['TSchema']
  >(location: K, command: Omit<S, '$location'>): object;

  switch<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$exec',
    Q extends U extends '$exec'
      ? NonNullable<operators.$switch<TContext, K>['TSchema']['$exec']>
      : string,
    V extends Q extends TFunction<infer R, any[]>
      ? NonNullable<R> extends (string | number)
        ? NonNullable<R>
        : void
      : Q extends string
        ? ExtractExpectationContextValue<TContext, K, Q>
        : void,
    S extends operators.$switch<TContext, K, V, TExpectationOperatorLocation, any>['TSchema'],
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$exec'>): object;

  has<
    K extends TExpectationOperatorLocation,
    S extends operators.$has<TContext, K>['TSchema']
  >(location: K, command?: Omit<S, '$location'>): object;

  has<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<TContext, K, Q> : unknown,
    S extends operators.$has<TContext, K, V>['TSchema']
  >(location: K, using: U, value: Q, command?: Omit<S, '$location' | '$path' | '$jsonPath'>): object;

  set<
    K extends TExpectationOperatorLocation,
    S extends operators.$set<TContext, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): object;

  set<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<TContext, K, Q> : unknown,
    S extends operators.$set<TContext, K, V>['TSchema']
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$jsonPath'>): object;

  merge<
    K extends TExpectationOperatorObjectLocation,
    S extends operators.$merge<TContext, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): object;

  merge<
    K extends TExpectationOperatorObjectLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<TContext, K, Q> : unknown,
    S extends operators.$merge<TContext, K, V>['TSchema']
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$jsonPath'>): object;

  remove<
    K extends TExpectationOperatorLocation,
    S extends operators.$remove<TContext, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): object;

  remove<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
  >(location: K, using: U, value: string): object;
}

export const compileExpectationOperators = <
  TInput extends IExpectationSchemaInput,
  TContext extends IExpectationSchemaContext<TInput> = IExpectationSchemaContext<TInput>
>(): ICompiledExpectationOperators<TContext> => ({
  not: (command) => ({ $not: command }),
  and: (command) => ({ $and: command }),
  or: (command) => ({ $or: command }),

  exec: (command) => ({ $exec: command }),
  if: (command) => ({ $if: command }),

  switch: <K extends TExpectationOperatorLocation>(
    $location: K,
    predicate: object | '$path' | '$exec',
    value?: unknown,
    command?: object
  ) => ({
    $switch: {
      $location,

      ...(typeof predicate === 'object' && predicate),
      ...(typeof predicate === 'string' && {
        ...(predicate === '$exec' && { $exec: value }),
        ...(predicate === '$path' && { $path: value }),
      }),

      ...(command ?? {}),
    },
  }),

  has: <K extends TExpectationOperatorLocation>(
    $location: K,
    predicate?: object | '$path' | '$jsonPath',
    value?: unknown,
    command?: object
  ) => ({
    $has: {
      $location,

      ...(typeof predicate === 'object' && predicate),
      ...(typeof predicate === 'string' && {
        ...(predicate === '$path' && { $path: value }),
        ...(predicate === '$jsonPath' && { $jsonPath: value }),
      }),

      ...(command ?? {}),
    },
  }),

  set: <K extends TExpectationOperatorLocation>(
    $location: K,
    predicate: object | '$path' | '$jsonPath',
    value?: unknown,
    command?: object
  ) => ({
    $set: {
      $location,

      ...(typeof predicate === 'object' && predicate),
      ...(typeof predicate === 'string' && {
        ...(predicate === '$path' && { $path: value }),
        ...(predicate === '$jsonPath' && { $jsonPath: value }),
      }),

      ...(command ?? {}),
    },
  }),

  merge: <K extends TExpectationOperatorObjectLocation>(
    $location: K,
    predicate: object | '$path' | '$jsonPath',
    value?: unknown,
    command?: object
  ) => ({
    $merge: {
      $location,

      ...(typeof predicate === 'object' && predicate),
      ...(typeof predicate === 'string' && {
        ...(predicate === '$path' && { $path: value }),
        ...(predicate === '$jsonPath' && { $jsonPath: value }),
      }),

      ...(command ?? {}),
    },
  }),

  remove: <K extends TExpectationOperatorObjectLocation>(
    $location: K,
    predicate: object | '$path' | '$jsonPath',
    value?: string,
  ) => ({
    $remove: {
      $location,

      ...(typeof predicate === 'object' && predicate),
      ...(typeof predicate === 'string' && {
        ...(predicate === '$path' && { $path: value }),
        ...(predicate === '$jsonPath' && { $jsonPath: value }),
      }),
    },
  }),
});
