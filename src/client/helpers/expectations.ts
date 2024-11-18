import type {
  ExtractExpectationContextValue,
  IExpectationOperatorContext,
  TExpectationOperatorLocation,
} from '../../expectations';

import type AndExpectationOperator from '../../expectations/operators/and.operator';
import type ExecExpectationOperator from '../../expectations/operators/exec.operator';
import type HasExpectationOperator from '../../expectations/operators/has.operator';
import type IfExpectationOperator from '../../expectations/operators/if.operator';
import type MergeExpectationOperator from '../../expectations/operators/merge.operator';
import type NotExpectationOperator from '../../expectations/operators/not.operator';
import type OrExpectationOperator from '../../expectations/operators/or.operator';
import type RemoveExpectationOperator from '../../expectations/operators/remove.operator';
import type SetExpectationOperator from '../../expectations/operators/set.operator';
import type SwitchExpectationOperator from '../../expectations/operators/switch.operator';

type TExpectationOperatorObjectLocation =
  | 'incoming.body'
  | 'incoming.headers'
  | 'incoming.query'
  | 'outgoing.data'
  | 'outgoing.headers';

export interface ICompiledExpectationOperators<T extends PartialDeep<IExpectationOperatorContext>> {
  not<S extends NotExpectationOperator<T, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $not: S };
  and<S extends AndExpectationOperator<T, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $and: S };
  or<S extends OrExpectationOperator<T, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $or: S };

  exec<S extends ExecExpectationOperator<T>['TSchema']>(command: S): { $exec: S };
  if<S extends IfExpectationOperator<T, TExpectationOperatorLocation, any>['TSchema']>(command: S): { $if: S };

  switch<
    K extends TExpectationOperatorLocation,
    S extends SwitchExpectationOperator<T, TExpectationOperatorLocation, void, TExpectationOperatorLocation, any>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $switch: S & { $location: K };
  };

  switch<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$exec',
    Q extends U extends '$exec'
      ? NonNullable<SwitchExpectationOperator<T, K>['TSchema']['$exec']>
      : string,
    V extends Q extends TFunction<infer R, any[]>
      ? NonNullable<R> extends (string | number)
        ? NonNullable<R>
        : void
      : Q extends string
        ? ExtractExpectationContextValue<T, K, Q>
        : void,
    S extends SwitchExpectationOperator<T, K, V, TExpectationOperatorLocation, any>['TSchema'],
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$exec'>): {
    $switch: S & { $location: K, $exec: Q }
  };

  has<
    K extends TExpectationOperatorLocation,
    S extends HasExpectationOperator<T, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $has: S & { $location: K };
  };

  has<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<T, K, Q> : unknown,
    S extends HasExpectationOperator<T, K, V>['TSchema']
  >(location: K, using: U, value: Q, command?: Omit<S, '$location' | '$path' | '$jsonPath'>): {
    $has: S & { $location: any, $path?: string, $jsonPath?: string }
  };

  set<
    K extends TExpectationOperatorLocation,
    S extends SetExpectationOperator<T, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $set: S & { $location: K };
  };

  set<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<T, K, Q> : unknown,
    S extends SetExpectationOperator<T, K, V>['TSchema']
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$jsonPath'>): {
    $set: S & { $location: K, $path?: string, $jsonPath?: string }
  };

  merge<
    K extends TExpectationOperatorObjectLocation,
    S extends MergeExpectationOperator<T, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $merge: S & { $location: K };
  };

  merge<
    K extends TExpectationOperatorObjectLocation,
    U extends '$path' | '$jsonPath',
    Q extends string,
    V extends U extends '$path' ? ExtractExpectationContextValue<T, K, Q> : unknown,
    S extends MergeExpectationOperator<T, K, V>['TSchema']
  >(location: K, using: U, value: Q, command: Omit<S, '$location' | '$path' | '$jsonPath'>): {
    $merge: S & { $location: K, $path?: string, $jsonPath?: string }
  };

  remove<
    K extends TExpectationOperatorLocation,
    S extends RemoveExpectationOperator<T, K>['TSchema']
  >(location: K, command: Omit<S, '$location'>): {
    $remove: S & { $location: K };
  };

  remove<
    K extends TExpectationOperatorLocation,
    U extends '$path' | '$jsonPath',
  >(location: K, using: U, value: string): {
    $remove: { $location: K, $path?: string, $jsonPath?: string }
  };
}

export const compileExpectationOperators = <T extends PartialDeep<IExpectationOperatorContext>>() => ({
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
    predicate: object | '$path' | '$jsonPath',
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
    value?: unknown,
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


} as ICompiledExpectationOperators<T>);
