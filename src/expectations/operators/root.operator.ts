import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import { PartialDeep } from '../../types';
import { Logger } from '../../logger';
import {
  IExpectationOperatorContext,
  IExpectationOperatorsSchema,
  TExpectationMetaTag,
  TExpectationOperatorLocation,
} from '../types';

const logger = Logger.build('Expectations.Operators.Root');

export default class RootExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TValue = void
> extends ExpectationOperator<
  TContext,
  IExpectationOperatorsSchema<TContext, TLocation, TValue>
> {
  public compiled = (() => {
    const extracted = this.extractNestedSchema(this.command);
    if (!extracted) {
      return null;
    }

    const Operator = <TExpectationOperatorConstructor<TContext>>this.operators[extracted.key];
    return new Operator(this.operators, extracted.nested);
  })();

  public get tags(): TExpectationMetaTag[] {
    return this.compiled?.tags ?? [];
  }

  public match(context: TContext): boolean {
    try {
      return this.compiled?.match(context) ?? false;
    } catch(error: any) {
      logger.error('Got error on expectation matching', error?.stack ?? error);
      return false;
    }
  }

  public manipulate<T extends TContext>(context: T): T {
    try {
      return this.compiled?.manipulate(context) ?? context;
    } catch(error: any) {
      logger.error('Got error on expectation manipulation', error?.stack ?? error);
      return context;
    }
  }
}
