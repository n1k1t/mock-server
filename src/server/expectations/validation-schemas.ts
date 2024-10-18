import { TSchema, Type } from '@n1k1t/typebox';

import { cast } from '../../utils';
import {
  LExpectationOperatorLocation,
  TExpectationConditionalOperator,
  TExpectationTargetionalOperator,
  TExpectationOperator,
} from './types';

type TExpectationValidationSchema = { [K in TExpectationOperator]: TSchema }
type TExpectationTargetionalValidationSchema = { [K in TExpectationTargetionalOperator]: TSchema }
type TExpectationConditionalValidationSchema = {
  [K in Exclude<TExpectationConditionalOperator, '$if'> | '$then' | '$else']: TSchema
}

export const ExpectationTargetionalValidationSchema = Type.Partial(
  Type.Object(cast<TExpectationTargetionalValidationSchema>({
    $jsonPath: Type.String(),
    $path: Type.String(),

    $location: Type.Union(LExpectationOperatorLocation.map((value) => Type.Literal(value))),

    $minimatch: Type.String(),
    $minimatchAnyOf: Type.Array(Type.String()),

    $regExp: Type.Object({}),
    $regExpAnyOf: Type.Array(Type.Object({})),

    $value: Type.Unknown(),
    $valueAnyOf: Type.Array(Type.Unknown()),
  })),
  { $id: 'ExpectationTargetionalSchema' }
);

export const ExpectationValidationSchema = Type.Recursive((This) => Type.Partial(
  Type.Object(cast<TExpectationValidationSchema>({
    $and: Type.Array(This),
    $or: Type.Array(This),

    $not: This,
    $if: Type.Partial(
      Type.Object(cast<TExpectationConditionalValidationSchema>({
        $then: This,
        $else: This,

        $has: Type.Ref(ExpectationTargetionalValidationSchema),

        $and: Type.Array(This),
        $or: Type.Array(This),
        $not: This,
      }))
    ),

    $has: Type.Ref(ExpectationTargetionalValidationSchema),
    $set: Type.Ref(ExpectationTargetionalValidationSchema),

    $merge: Type.Ref(ExpectationTargetionalValidationSchema),
    $remove: Type.Ref(ExpectationTargetionalValidationSchema),

    $exec: Type.String(),
  })),
  { $id: 'ExpectationSchema' }
))
