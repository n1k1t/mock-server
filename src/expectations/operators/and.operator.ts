import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import {
  IExpectationSchemaContext,
  IExpectationOperatorsSchema,
  TExpectationMetaTag,
  TExpectationOperatorLocation,
} from '../types';

export default class AndExpectationOperator<
  TContext extends IExpectationSchemaContext,
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

  public get tags(): TExpectationMetaTag[] {
    return this.compiled.reduce<TExpectationMetaTag[]>((acc, operator) => acc.concat(operator.tags), []);
  }

  public match(context: TContext): boolean {
    return this.compiled.every((operator) => operator.match(context));
  }

  public manipulate<T extends TContext>(context: T): T {
    this.compiled.forEach((operator) => operator.manipulate(context));
    return context;
  }
}
