import { IExpectationOperatorContext, IExpectationOperatorsSchema, TExpectationOperatorLocation } from '../types';
import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import { PartialDeep } from '../../types';

export default class OrExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TValue = void
> extends ExpectationOperator<
  TContext,
  IExpectationOperatorsSchema<TContext, TLocation, TValue>[]
> {
  public compiled = this.command
    .map((schema) => this.extractNestedSchema(schema)!)
    .filter(Boolean)
    .map((extracted) => {
      const Operator = <TExpectationOperatorConstructor<TContext>>this.operators[extracted.key];
      return new Operator(this.operators, extracted.nested);
    });

  public match(context: TContext): boolean {
    return this.compiled.some((operator) => operator.match(context));
  }

  public manipulate<T extends TContext>(context: T): T {
    this.compiled.forEach((operator) => operator.manipulate(context));
    return context;
  }
}
