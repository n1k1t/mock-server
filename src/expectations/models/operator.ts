import { Faker, ru, en, en_GB } from '@faker-js/faker';
import dayjs from 'dayjs';
import _ from 'lodash';

import {
  IExpectationOperatorContext,
  IExpectationOperatorExecUtils,
  IExpectationOperatorsSchema,
  TExpectationOperators,
} from '../types';

export type TExpectationOperatorConstructor<TContext extends PartialDeep<IExpectationOperatorContext>> =
  Constructable<ExpectationOperator<TContext, any>, ConstructorParameters<typeof ExpectationOperator>>

export abstract class ExpectationOperator<TContext extends PartialDeep<IExpectationOperatorContext>, TSchema> {
  public TContext!: TContext;
  public TSchema!: TSchema;

  public abstract match(context: TContext): boolean;
  public abstract manipulate<T extends TContext>(context: T): T;

  constructor(public operators: TExpectationOperators, public command: TSchema) {}

  protected compileExecHandler(raw: TFunction<any, any[]> | string, provide: ('payload' | 'utils')[]) {
    const parameters: string[] = [];

    if (provide.includes('payload')) {
      parameters.push('payload');
    }
    if (provide.includes('utils')) {
      parameters.push('{ _, T, context }');
    }

    const handler = typeof raw === 'function' ? raw : Function(parameters.join(', '), `return (() => ${raw})()`);

    return (context: TContext, ...args: unknown[]) => {
      const utils = this.compileExecUtils(context);
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

  private compileExecUtils<T extends TContext>(context: T): IExpectationOperatorExecUtils<T> {
    const faker = new Faker({ locale: [ru, en, en_GB] });

    if (context.seed) {
      faker.seed(context.seed);
    }

    return {
      context: <T & IExpectationOperatorContext>context,
      T: (payload) => <any>payload,

      _: _,
      d: dayjs,
      faker: faker,
    }
  }
}
