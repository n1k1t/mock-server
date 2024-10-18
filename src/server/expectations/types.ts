import type { IRequestPlainContext, IResponsePlainContext } from '../models';

export type TExpectationType = ConvertTupleToUnion<typeof LExpectationType>;
export const LExpectationType = <const>['HTTP'];

export type TExpectationForwardProtocol = ConvertTupleToUnion<typeof LExpectationForwardProtocol>;
export const LExpectationForwardProtocol = <const>['HTTP', 'HTTPS'];

export type TExpectationDestroyType = ConvertTupleToUnion<typeof LExpectationDestroyType>;
export const LExpectationDestroyType = <const>['ECONNABORTED'];

export type TExpectationOperatorLocation = ConvertTupleToUnion<typeof LExpectationOperatorLocation>;
export const LExpectationOperatorLocation = <const>['path', 'method', 'headers', 'body', 'query', 'data', 'statusCode'];

export type TExpectationConditionalOperator = ConvertTupleToUnion<typeof LExpectationConditionalOperator>;
export const LExpectationConditionalOperator = <const>['$if', '$not', '$and', '$or', '$has'];

export type TExpectationActionalOperator = ConvertTupleToUnion<typeof LExpectationActionalOperator>;
export const LExpectationActionalOperator = <const>['$set', '$remove', '$merge', '$exec'];

export type TExpectationAttachlessOperator = ConvertTupleToUnion<typeof LExpectationAttachlessOperator>;
export const LExpectationAttachlessOperator = <const>[...LExpectationActionalOperator, '$has'];

export interface IExpectationMeta {
  executionsCount: number;

  additional: {
    requestPaths?: string[];
    requestMethods?: string[];
    responseStatuses?: number[];
  }
};

export interface IExpectationDelay {
  ms: number;
  times?: number;
};

export type TExpectationContextLocation = 'request' | 'response';
export type TExpectationContext<TLocation extends TExpectationContextLocation = TExpectationContextLocation> = {
  request: IRequestPlainContext;
  response: IRequestPlainContext & IResponsePlainContext;
}[TLocation];

export type TExpectationOperatorMode = 'validation' | 'manipulation';

export type TExpectationOperatorHandlerParameters<
  K extends TExpectationOperator = TExpectationOperator
> = [
  TExpectationOperatorMode,
  NonNullable<IExpectationSchema[K]>,
  TExpectationContext,
];

export type TExpectationOperatorHandler<
  K extends TExpectationOperator = TExpectationOperator
> = TFunction<boolean, [
  ...TExpectationOperatorHandlerParameters<K>,
  {
    exploreNestedSchema: TFunction<boolean, TExpectationOperatorHandlerParameters>;
  }
]>;

export type TExpectationOperator =
  | TExpectationConditionalOperator
  | TExpectationActionalOperator;

export type TExpectationTargetionalValidationOperator = keyof IExpectationTargetionalSchema;
export type TExpectationTargetionalManipulationOperator = '$location' | '$path' | '$jsonPath' | '$value';

export type TExpectationTargetionalOperator =
  | TExpectationTargetionalValidationOperator
  | TExpectationTargetionalManipulationOperator;

export interface IExpectationTargetionalSchema<
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation
> {
  $location?: TLocation;

  $path?: string;
  $jsonPath?: string;

  $regExp?: RegExp;
  $regExpAnyOf?: RegExp[];

  $value?: unknown;
  $valueAnyOf?: unknown[];

  $minimatch?: string;
  $minimatchAnyOf?: string[];
};

export interface IExpectationSchemaConfiguration {
  operator: TExpectationOperator;
  useOperatorsOverride: Partial<Record<TExpectationOperator, unknown>>;

  targetionalValidationOperator: TExpectationTargetionalValidationOperator;
  targetionalManipulationOperator: TExpectationTargetionalManipulationOperator;

  validationLocation: TExpectationOperatorLocation;
  manipulationLocation: TExpectationOperatorLocation;
};

export interface IExpectationSchema<
  T extends IExpectationSchemaConfiguration = IExpectationSchemaConfiguration
> {
  $has?: Pick<
    IExpectationTargetionalSchema<T['validationLocation']>,
    Extract<T['targetionalValidationOperator'], TExpectationTargetionalValidationOperator>
  >;

  $set?: Pick<
    IExpectationTargetionalSchema<T['manipulationLocation']>,
    Extract<T['targetionalManipulationOperator'], TExpectationTargetionalManipulationOperator>
  >;

  $remove?: Pick<
    IExpectationTargetionalSchema<T['manipulationLocation']>,
    Extract<T['targetionalManipulationOperator'], TExpectationTargetionalManipulationOperator>
  >;

  $merge?: Pick<
    IExpectationTargetionalSchema<T['manipulationLocation']>,
    Extract<T['targetionalManipulationOperator'], TExpectationTargetionalManipulationOperator>
  >;

  $if?: IExpectationSchema<T> & {
    $then?: Pick<IExpectationSchema<T>, T['operator']>;
    $else?: Pick<IExpectationSchema<T>, T['operator']>;
  };

  $not?: Pick<IExpectationSchema<T>, T['operator']>;
  $and?: Pick<IExpectationSchema<T>, T['operator']>[];
  $or?: Pick<IExpectationSchema<T>, T['operator']>[];

  $exec?: CheckKeyIsRequired<T['useOperatorsOverride'], '$exec'> extends true
    ? T['useOperatorsOverride']['$exec']
    : string;
};

export type BuildExpectaionSchema<
  TConfiguration extends Partial<IExpectationSchemaConfiguration>,
  U extends IExpectationSchemaConfiguration = IExpectationSchemaConfiguration & TConfiguration
> = Pick<IExpectationSchema<U>, U['operator']>;
