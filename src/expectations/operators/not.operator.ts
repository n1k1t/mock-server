import { IExpectationOperatorContext, IExpectationOperatorsSchema, TExpectationOperatorLocation } from '../types';
import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import { PartialDeep } from '../../types';

export default class NotExpectationOperator<
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
    return this.compiled ? !this.compiled.match(context) : false;
  }

  public manipulate<T extends TContext>(context: T): T {
    return context;
  }
}
