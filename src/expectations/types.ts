import type { AxiosProxyConfig } from 'axios';
import type { Observable } from 'rxjs';
import type { faker } from '@faker-js/faker';
import type dayjs from 'dayjs';
import type * as rxjs from 'rxjs';
import type _ from 'lodash';

import type { Container, IRequestContextIncoming, IRequestContextOutgoing, RequestContextSnapshot } from '../server/models';
import type { ConvertTupleToUnion, ExtractObjectValueByPath } from '../types';
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

export type TExpectationFlatOperator = ConvertTupleToUnion<typeof LExpectationFlatOperator>;
export const LExpectationFlatOperator = <const>['$set', '$remove', '$merge', '$exec', '$has'];

export type TExpectationMetaTagLocation = ConvertTupleToUnion<typeof LExpectationMetaTagLocation>;
export const LExpectationMetaTagLocation = <const>['path', 'method', 'outgoing.status'];

export type TExpectationMetaTag =
  | { location: 'path' | 'method' | 'error', value: string }
  | { location: 'outgoing.status', value: number };

export interface IExpectationMeta {
  executionsCount: number;
  tags: TExpectationMetaTag[];
};

export type TExpectationContextLocation = 'request' | 'response';

export type TExpectationOperatorLocation = ConvertTupleToUnion<typeof LExpectationOperatorLocation>;
export const LExpectationOperatorLocation = <const>[
  'transport',
  'event',
  'flags',

  'container',
  'cache',
  'state',
  'seed',
  'error',
  'delay',

  'path',
  'method',

  'incoming.data',
  'incoming.dataRaw',
  'incoming.query',
  'incoming.headers',
  'incoming.stream',

  'outgoing.data',
  'outgoing.dataRaw',
  'outgoing.status',
  'outgoing.headers',
  'outgoing.stream',
];

export type TExpectationOperatorObjectLocation =
  | 'cache'
  | 'state'
  | 'flags'
  | 'incoming.data'
  | 'incoming.headers'
  | 'incoming.query'
  | 'outgoing.data'
  | 'outgoing.headers';

export type TExpectationOperators = Omit<typeof operators, 'root'>;

export interface IExpectationSchemaInput {
  state?: Record<string, any>;

  incoming?: Pick<IRequestContextIncoming, 'query' | 'data'>;
  outgoing?: Pick<IRequestContextOutgoing, 'data'>;

  container?: object;
  transport?: any;
  event?: any;
  flag?: any;
}

type ExtractData<T extends IExpectationSchemaInput['incoming'] | IExpectationSchemaInput['outgoing']> =
  'data' extends keyof T ? T['data'] : any;

export interface IExpectationSchemaContext<TInput extends IExpectationSchemaInput = {}> {
  transport: TInput['transport'];
  event: TInput['event'];
  flags: Partial<Record<TInput['flag'], boolean>>;

  state: TInput['state'] extends object ? TInput['state'] : Record<string, any>;
  storage: RequestContextSnapshot['storage'];
  cache: TInput extends object ? RequestContextSnapshot['cache'] : any;

  container?: Container<NonNullable<TInput['container']>>;
  seed?: RequestContextSnapshot['seed'];

  incoming: TInput['incoming'] extends object
    ? Omit<IRequestContextIncoming, 'stream'> & TInput['incoming'] & {
      data?: ExtractData<TInput['incoming']>;
      stream?: Observable<ExtractData<TInput['incoming']>>;
    }
    : IRequestContextIncoming;

  outgoing: TInput['outgoing'] extends object
    ? IRequestContextOutgoing & TInput['outgoing'] & {
      data?: ExtractData<TInput['outgoing']>;
      stream?: Observable<ExtractData<TInput['outgoing']>>;
    }
    : IRequestContextOutgoing;
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
  U = ExtractObjectValueByPath<IExpectationSchemaContext, ConvertExpectationLocationToContextPath<TLocation>>,
> = Exclude<T, never> extends never ? Exclude<U, never> extends never ? any : U : T;

export type ExtractExpectationContextValue<
  TContext extends IExpectationSchemaContext,
  TLocation extends TExpectationOperatorLocation,
  TPath extends string | void = void,
  T = ExtractExpectationContextValueByLocation<TContext, TLocation>,
  U = TPath extends string ? T extends object ? ExtractObjectValueByPath<T, TPath> : any : T
> = Exclude<U, never> extends never ? any : U;

export type CompileExpectationOperatorValue<
  TContext extends IExpectationSchemaContext,
  TLocation extends TExpectationOperatorLocation,
  TProvided = void,
  T = ExtractExpectationContextValue<TContext, TLocation>
> = Exclude<TProvided, void> extends never ? T : TProvided;

export type CompileExpectationOperatorValueWithPredicate<
  TContext extends IExpectationSchemaContext,
  TLocation extends TExpectationOperatorLocation,
  TProvided = void,
  T = CompileExpectationOperatorValue<TContext, TLocation, TProvided>
> = T extends object ? (T | object) : T;

export interface IExpectationOperatorsSchema<
  TContext extends IExpectationSchemaContext = IExpectationSchemaContext,
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
  $merge?: MergeExpectationOperator<TContext, Extract<TLocation, TExpectationOperatorObjectLocation>, TValue>['TSchema'];
  $remove?: RemoveExpectationOperator<TContext, TLocation>['TSchema'];

  $exec?: ExecExpectationOperator<TContext>['TSchema'];
};

export interface IExpectationSchemaForward {
  url?: string;
  baseUrl?: string;
  timeout?: number;

  cache?: Pick<RequestContextSnapshot['cache'], 'key' | 'prefix' | 'ttl'> & {
    storage?: 'redis';
  };

  options?: {
    host?: 'origin';
  };

  proxy?: AxiosProxyConfig;
}

export interface IExpectationSchema<TContext extends IExpectationSchemaContext = IExpectationSchemaContext> {
  request?: IExpectationOperatorsSchema<TContext>;
  response?: IExpectationOperatorsSchema<TContext>;
  forward?: IExpectationSchemaForward;
};

export type IExpectationExecMode = 'match' | 'manipulate';

export interface IExpectationExecUtils<T extends IExpectationSchemaContext> {
  context: T;
  logger: Logger;

  mode: IExpectationExecMode;
  meta: MetaContext;

  T: <T = any>(payload: unknown) => T;

  _: typeof _;
  d: typeof dayjs;
  rx: typeof rxjs;
  faker: typeof faker;
}
