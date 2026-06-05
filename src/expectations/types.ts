import type dayjs from 'dayjs';
import type _ from 'lodash';

import type * as rxjs from 'rxjs';

import type { Observable } from 'rxjs';
import type { faker } from '@faker-js/faker';

import type { ConvertTupleToUnion, ExtractObjectValueByPath, OverrideObject, PartialDeep } from '../../types';
import type { MetaContext } from '../meta';
import type { Logger } from '../logger';
import type {
  Container,
  ContainersStorage,
  IRequestContextIncoming,
  IRequestContextOutgoing,
  RequestContextSnapshot,
  RequestMessage
} from '../server/models';

import type * as operators from './operators';

export type TExpectationFlatOperator = ConvertTupleToUnion<typeof LExpectationFlatOperator>;
export const LExpectationFlatOperator = <const>['$set', '$remove', '$merge', '$exec', '$has'];

export interface IExpectationMeta {
  tags: {
    incoming?: Partial<Record<'path' | 'method' | 'error', string[]>>;
    outgoing?: Partial<Record<'status', number[]>>;

    forward?: Partial<Pick<IExpectationSchemaForward, 'url'>>;
  };

  metrics: {
    executions: number;
  };
};

export type TExpectationContextLocation = 'request' | 'response';

export type TExpectationOperatorLocation = ConvertTupleToUnion<typeof LExpectationOperatorLocation>;
export const LExpectationOperatorLocation = <const>[
  'transport',
  'flags',

  'container',
  'overrides',
  'cache',
  'state',
  'seed',
  'error',
  'delay',

  'path',
  'query',
  'method',

  'incoming.path',
  'incoming.method',
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
  state: {};

  incoming: {
    query?: Record<string, any>;
    data?: any;
  };

  outgoing: {
    data?: any;
  };

  container: {};
  transport: string & {};
  flag: string & {};
}

interface IExpectationSchemaIncomingOverride<
  TInput extends Partial<IExpectationSchemaInput['incoming']>
> extends Omit<IRequestContextIncoming, 'query' | 'data' | 'stream'> {
  stream: Observable<RequestMessage<TInput['data']>>;

  data: 'data' extends keyof TInput
    ? TInput['data']
    : IExpectationSchemaInput['incoming']['data'];

  query: TInput['query'] extends object
    ? TInput['query']
    : IExpectationSchemaInput['incoming']['query'];
}

interface IExpectationSchemaOutgoingOverride<
  TInput extends Partial<IExpectationSchemaInput['outgoing']>
> extends Omit<IRequestContextOutgoing, 'data' | 'stream'> {
  stream: Observable<RequestMessage<TInput['data']>>;

  data: 'data' extends keyof TInput
    ? TInput['data']
    : IExpectationSchemaInput['outgoing']['data'];
}

export interface IExpectationSchemaContext<
  TInput extends Partial<IExpectationSchemaInput> = {},
  TMerged extends IExpectationSchemaInput = OverrideObject<IExpectationSchemaInput, TInput>
> {
  transport: TMerged['transport'];
  flags: Partial<Record<TMerged['flag'], boolean>>;

  storage: ContainersStorage<TMerged['container']>;
  cache: RequestContextSnapshot['cache'];
  state: TMerged['state'];

  incoming: TInput['incoming'] extends Partial<IExpectationSchemaInput['incoming']>
    ? IExpectationSchemaIncomingOverride<TInput['incoming']>
    : IRequestContextIncoming;

  outgoing: TInput['outgoing'] extends Partial<IExpectationSchemaInput['outgoing']>
    ? IExpectationSchemaOutgoingOverride<TInput['outgoing']>
    : IRequestContextOutgoing;

  overrides?: RequestContextSnapshot['overrides'];

  container?: Container<NonNullable<TMerged['container']>>;
  seed?: RequestContextSnapshot['seed'];
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
  $and?: operators.$and<TContext, TLocation, TValue>['TSchema'];
  $or?: operators.$or<TContext, TLocation, TValue>['TSchema'];

  $not?: operators.$not<TContext, TLocation, TValue>['TSchema'];
  $if?: operators.$if<TContext, TLocation, TValue>['TSchema'];
  $switch?: operators.$switch<TContext, TLocation, TValue, TLocation, TValue>['TSchema'];

  $set?: operators.$set<TContext, TLocation, TValue>['TSchema'];
  $has?: operators.$has<TContext, TLocation, TValue>['TSchema'];
  $merge?: operators.$merge<TContext, Extract<TLocation, TExpectationOperatorObjectLocation>, TValue>['TSchema'];
  $remove?: operators.$remove<TContext, TLocation>['TSchema'];

  $exec?: operators.$exec<TContext>['TSchema'];
};

export interface IExpectationSchemaForward {
  /** Helps to disable forwarding using `overrides` (default `true`) */
  isEnabled?: boolean;

  url?: string;
  baseUrl?: string;

  /** Milliseconds (default `30s`) */
  timeout?: number;

  cache?: Pick<RequestContextSnapshot['cache'], 'key' | 'prefix' | 'ttl'> & {
    storage?: 'redis';
  };

  options?: {
    /** Rewrites the `Host` header by forwarding url. Default is `true` */
    overrideHost?: boolean;
  };

  proxy?: {
    host: string;
    port: number;
  };
}

export interface IExpectationSchema<TContext extends IExpectationSchemaContext> {
  request?: IExpectationOperatorsSchema<TContext>;
  response?: IExpectationOperatorsSchema<TContext>;
  forward?: IExpectationSchemaForward;
};

export interface IExpectationDefaults<TContext extends IExpectationSchemaContext> {
  state?: PartialDeep<TContext['state']>;
}

export type IExpectationExecMode = 'match' | 'manipulate';

export interface IExpectationExecUtils<T extends IExpectationSchemaContext> {
  context: T;
  logger: Logger;

  mode: IExpectationExecMode;
  meta: MetaContext;

  _: typeof _;
  d: typeof dayjs;
  rx: typeof rxjs;
  faker: typeof faker;
}
