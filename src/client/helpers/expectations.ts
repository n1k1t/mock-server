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
  not<S extends operators.$not<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $not: any };
  and<S extends operators.$and<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $and: any[] };
  or<S extends operators.$or<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $or: any[] };

  exec<S extends operators.$exec<TContext>['TSchema']>(command: S): { $exec: any };
  if<S extends operators.$if<TContext, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $if: any };

  switch<
    K extends TExpectationOperatorLocation,
    S extends operators.$switch<TContext, TExpectationOperatorLocation, void, TExpectationOperatorLocation, any>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $switch: any;
  };

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
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$exec'>): {
    $switch: any;
  };

  has<
    K extends TExpectationOperatorLocation,
    S extends operators.$has<TContext, K>['TSchema']
  >(location: K, command?: Omit<S, '$location'>): {
    $has: any;
  };

  has<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<TContext, K, Q> : unknown,
    S extends operators.$has<TContext, K, V>['TSchema']
  >(location: K, using: U, value: Q, command?: Omit<S, '$location' | '$path' | '$jsonPath'>): {
    $has: any;
  };

  set<
    K extends TExpectationOperatorLocation,
    S extends operators.$set<TContext, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $set: any;
  };

  set<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<TContext, K, Q> : unknown,
    S extends operators.$set<TContext, K, V>['TSchema']
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$jsonPath'>): {
    $set: any;
  };

  merge<
    K extends TExpectationOperatorObjectLocation,
    S extends operators.$merge<TContext, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $merge: any;
  };

  merge<
    K extends TExpectationOperatorObjectLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<TContext, K, Q> : unknown,
    S extends operators.$merge<TContext, K, V>['TSchema']
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$jsonPath'>): {
    $merge: any;
  };

  remove<
    K extends TExpectationOperatorLocation,
    S extends operators.$remove<TContext, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $remove: any;
  };

  remove<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
  >(location: K, using: U, value: string): {
    $remove: any;
  };
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
