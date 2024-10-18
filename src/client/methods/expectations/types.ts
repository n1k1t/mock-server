import type { TExpectationExecOperatorHandler } from '../../../server/expectations/operators/exec.operator';
import type { IRequestPlainContext, IResponsePlainContext } from '../../../server/models';
import type { BuildExpectaionSchema, Expectation, IExpectationSchema } from '../../../types';

export type TExpectationRequestSchemaConfiguration =
  NonNullable<Expectation['request']> extends IExpectationSchema<infer R> ? R : never;

export type TExpectationResponseSchemaConfiguration =
  NonNullable<Expectation['response']> extends IExpectationSchema<infer R> ? R : never;

export interface IOverridedExpectationSegment {
  request?: BuildExpectaionSchema<TExpectationRequestSchemaConfiguration & {
    useOperatorsOverride: {
      $exec: TExpectationExecOperatorHandler<IRequestPlainContext>;
    };
  }>;

  response?: BuildExpectaionSchema<TExpectationResponseSchemaConfiguration & {
    useOperatorsOverride: {
      $exec: TExpectationExecOperatorHandler<IRequestPlainContext & IResponsePlainContext>;
    };
  }>;
}
