import { Faker, ru, en, en_GB } from '@faker-js/faker';
import dayjs from 'dayjs';
import _ from 'lodash';

import { Constructable, PartialDeep, TFunction } from '../../types';
import { metaStorage } from '../../meta';
import { Logger } from '../../logger';
import {
  IExpectationOperatorContext,
  IExpectationOperatorExecMode,
  IExpectationOperatorExecUtils,
  IExpectationOperatorsSchema,
  TExpectationMetaTag,
  TExpectationOperators,
} from '../types';

const logger = Logger.build('Expectations.Models.Operator');

export type TExpectationOperatorConstructor<TContext extends PartialDeep<IExpectationOperatorContext>> =
  Constructable<ExpectationOperator<TContext, any>, ConstructorParameters<typeof ExpectationOperator>>

export abstract class ExpectationOperator<TContext extends PartialDeep<IExpectationOperatorContext>, TSchema> {
  public TContext!: TContext;
  public TSchema!: TSchema;

  public abstract match(context: TContext): boolean;
  public abstract manipulate<T extends TContext>(context: T): T;

  public abstract get tags(): TExpectationMetaTag[];

  constructor(public operators: TExpectationOperators, public command: TSchema) {}

  protected compileExecHandler(raw: TFunction<any, any[]> | string, provide: ('payload' | 'utils')[]) {
    const parameters: string[] = [];

    if (provide.includes('payload')) {
      parameters.push('payload');
    }
    if (provide.includes('utils')) {
      parameters.push('{ context, mode, meta, T, _, d, faker }');
    }

    const handler = typeof raw === 'function' ? raw : Function(parameters.join(', '), `return (() => ${raw})()`);

    return (mode: IExpectationOperatorExecMode, context: TContext, ...args: unknown[]) => {
      const utils = this.compileExecUtils(mode, context);
      const handled = handler(...args, utils);

      return typeof handled === 'function' ? handled(...args, utils) : handled;
    }
  }

  protected extractNestedSchema(schema: IExpectationOperatorsSchema<any, any>): {
    [K in keyof IExpectationOperatorsSchema]: null | {
      key: K;
      nested: IExpectationOperatorsSchema[K];
    }
  }[keyof IExpectationOperatorsSchema] {
    const key = <keyof IExpectationOperatorsSchema | undefined>Object.keys(schema)[0];
    return key ? { key, nested: <any>schema[key] } : null;
  }

  private compileExecUtils<T extends TContext>(
    mode: IExpectationOperatorExecMode,
    context: T
  ): IExpectationOperatorExecUtils<T> {
    const faker = new Faker({ locale: [ru, en, en_GB] });

    if (context.seed) {
      faker.seed(context.seed);
    }

    return {
      mode,
      logger,
      context: <IExpectationOperatorExecUtils<T>['context']>context,

      meta: metaStorage.provide(),
      T: (payload) => <any>payload,

      _: _,
      d: dayjs,
      faker: faker,
    }
  }
}
