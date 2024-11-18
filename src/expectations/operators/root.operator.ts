import { IExpectationOperatorContext, IExpectationOperatorsSchema, TExpectationOperatorLocation } from '../types';
import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';

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

  public match(context: TContext): boolean {
    try {
      return this.compiled?.match(context) ?? false;
    } catch(error) {
      console.error('Got error on expectation matching', error);
      return false;
    }
  }

  public manipulate<T extends TContext>(context: T): T {
    try {
      return this.compiled?.manipulate(context) ?? context;
    } catch(error) {
      console.error('Got error on expectation manipulation', error);
      return context;
    }
  }
}
