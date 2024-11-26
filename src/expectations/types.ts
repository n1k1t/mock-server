import type { AxiosProxyConfig } from 'axios';
import type { faker } from '@faker-js/faker';
import type dayjs from 'dayjs';
import type _ from 'lodash';

import type { ConvertTupleToUnion, ExtractObjectValueByPath, PartialDeep, TRequestProtocol } from '../types';
import type { HttpRequestContext } from '../server/models';
import type { MetaContext } from '../meta';
import type { Logger } from '../logger';

import type * as operators from './operators';

import type AndExpectationOperator from './operators/and.operator';
import type SetExpectationOperator from './operators/set.operator';
import type HasExpectationOperator from './operators/has.operator';
import type OrExpectationOperator from './operators/or.operator';
import type NotExpectationOperator from './operators/not.operator';
import type IfExpectationOperator from './operators/if.operator';
import type MergeExpectationOperator from './operators/merge.operator';
import type RemoveExpectationOperator from './operators/remove.operator';
import type ExecExpectationOperator from './operators/exec.operator';
import type SwitchExpectationOperator from './operators/switch.operator';

export type TExpectationType = ConvertTupleToUnion<typeof LExpectationType>;
export const LExpectationType = <const>['HTTP'];

export type TExpectationForwardProtocol = ConvertTupleToUnion<typeof LExpectationForwardProtocol>;
export const LExpectationForwardProtocol = <const>['HTTP', 'HTTPS'];

export type TExpectationDestroyType = ConvertTupleToUnion<typeof LExpectationDestroyType>;
export const LExpectationDestroyType = <const>['ECONNABORTED'];

export type TExpectationConditionalOperator = ConvertTupleToUnion<typeof LExpectationConditionalOperator>;
export const LExpectationConditionalOperator = <const>['$if', '$not', '$and', '$or', '$has'];

export type TExpectationActionalOperator = ConvertTupleToUnion<typeof LExpectationActionalOperator>;
export const LExpectationActionalOperator = <const>['$set', '$remove', '$merge', '$exec'];

export type TExpectationAttachlessOperator = ConvertTupleToUnion<typeof LExpectationAttachlessOperator>;
export const LExpectationAttachlessOperator = <const>[...LExpectationActionalOperator, '$has'];

export interface IExpectationMeta {
  executionsCount: number;

  additional: {
    paths?: string[];
    methods?: string[];
    statuses?: number[];
  };
};

export type TExpectationContextLocation = 'request' | 'response';

export type TExpectationOperatorLocation = ConvertTupleToUnion<typeof LExpectationOperatorLocation>;
export const LExpectationOperatorLocation = <const>[
  'error',
  'delay',
  'state',
  'seed',

  'path',
  'method',
  'incoming.body',
  'incoming.bodyRaw',
  'incoming.query',
  'incoming.headers',
  'outgoing.status',
  'outgoing.headers',
  'outgoing.data',
  'outgoing.dataRaw',
];

export type TExpectationOperatorObjectLocation =
  | 'state'
  | 'incoming.body'
  | 'incoming.headers'
  | 'incoming.query'
  | 'outgoing.data'
  | 'outgoing.headers';

export type TExpectationOperators = Omit<typeof operators, 'root'>;

export interface IExpectationOperatorContext extends Pick<HttpRequestContext['TPlain'], 'incoming' | 'outgoing'> {
  state: Record<string, unknown>;

  seed?: number;
  delay?: number;
};

type ConvertExpectationLocationToContextPath<TLocation extends TExpectationOperatorLocation> =
  TLocation extends 'path' | 'method' | 'error' | 'delay'
    ? {
      path: 'incoming.path';
      delay: 'incoming.delay';
      error: 'incoming.error';
      method: 'incoming.method';
    }[TLocation]
    : TLocation;

export type ExtractExpectationContextValueByLocation<
  TContext extends object,
  TLocation extends TExpectationOperatorLocation,
  T = ExtractObjectValueByPath<TContext, ConvertExpectationLocationToContextPath<TLocation>>,
  U = ExtractObjectValueByPath<IExpectationOperatorContext, ConvertExpectationLocationToContextPath<TLocation>>,
> = Exclude<T, never> extends never ? Exclude<U, never> extends never ? any : U : T;

export type ExtractExpectationContextValue<
  TContext extends PartialDeep<IExpectationOperatorContext>,
  TLocation extends TExpectationOperatorLocation,
  TPath extends string | void = void,
  T = ExtractExpectationContextValueByLocation<TContext, TLocation>,
  U = TPath extends string ? T extends object ? ExtractObjectValueByPath<T, TPath> : any : T
> = Exclude<U, never> extends never ? any : U;

export type CompileExpectationOperatorValue<
  TContext extends PartialDeep<IExpectationOperatorContext>,
  TLocation extends TExpectationOperatorLocation,
  TProvided = void,
  T = ExtractExpectationContextValue<TContext, TLocation>
> = Exclude<TProvided, void> extends never ? T : TProvided;

export type CompileExpectationOperatorValueWithPredicate<
  TContext extends PartialDeep<IExpectationOperatorContext>,
  TLocation extends TExpectationOperatorLocation,
  TProvided = void,
  T = CompileExpectationOperatorValue<TContext, TLocation, TProvided>
> = T extends object ? (T | object) : T;

export interface IExpectationOperatorsSchema<
  TContext extends PartialDeep<IExpectationOperatorContext> = IExpectationOperatorContext,
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TValue = void
> {
  $and?: AndExpectationOperator<TContext, TLocation, TValue>['TSchema'];
  $or?: OrExpectationOperator<TContext, TLocation, TValue>['TSchema'];

  $not?: NotExpectationOperator<TContext, TLocation, TValue>['TSchema'];
  $if?: IfExpectationOperator<TContext, TLocation, TValue>['TSchema'];
  $switch?: SwitchExpectationOperator<TContext, TLocation, TValue, TLocation, TValue>['TSchema'];

  $set?: SetExpectationOperator<TContext, TLocation, TValue>['TSchema'];
  $has?: HasExpectationOperator<TContext, TLocation, TValue>['TSchema'];
  $merge?: MergeExpectationOperator<TContext, TLocation, TValue>['TSchema'];
  $remove?: RemoveExpectationOperator<TContext, TLocation>['TSchema'];

  $exec?: ExecExpectationOperator<TContext>['TSchema'];
};

export interface IExpectationSchema<TContext extends PartialDeep<IExpectationOperatorContext> = {}> {
  request?: IExpectationOperatorsSchema<TContext>;
  response?: IExpectationOperatorsSchema<TContext>;

  forward?: {
    url?: string;
    baseUrl?: string;

    timeout?: number;
    proxy?: AxiosProxyConfig & {
      protocol: TRequestProtocol;
    };
  };
};

export type IExpectationOperatorExecMode = 'match' | 'manipulate';

export interface IExpectationOperatorExecUtils<T extends PartialDeep<IExpectationOperatorContext>> {
  context: IExpectationOperatorContext & T;
  logger: Logger;

  mode: IExpectationOperatorExecMode;
  meta: MetaContext;

  T: <T = any>(payload: unknown) => T;

  _: typeof _;
  d: typeof dayjs;
  faker: typeof faker;
}
