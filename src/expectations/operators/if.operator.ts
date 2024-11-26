import { IExpectationOperatorContext, IExpectationOperatorsSchema, TExpectationOperatorLocation } from '../types';
import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import { PartialDeep } from '../../types';

export default class IfExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TValue = void
> extends ExpectationOperator<
  TContext,
  {
    $condition: Pick<IExpectationOperatorsSchema<TContext, TLocation, TValue>, '$and' | '$exec' | '$has' | '$or' | '$not'>;

    $then?: IExpectationOperatorsSchema<TContext, TLocation, TValue>;
    $else?: IExpectationOperatorsSchema<TContext, TLocation, TValue>;
  }
> {
  public compiled = {
    condition: (() => {
      const extracted = this.extractNestedSchema(this.command.$condition);
      if (!extracted) {
        return null;
      }

      const Operator = <TExpectationOperatorConstructor<TContext>>this.operators[extracted.key];
      return new Operator(this.operators, extracted.nested);
    })(),

    ...(this.command.$then && {
      then: (() => {
        const extracted = this.extractNestedSchema(this.command.$then);
        if (!extracted) {
          return null;
        }

        const Operator = <TExpectationOperatorConstructor<TContext>>this.operators[extracted.key];
        return new Operator(this.operators, extracted.nested);
      })(),
    }),

    ...(this.command.$else && {
      else: (() => {
        const extracted = this.extractNestedSchema(this.command.$else);
        if (!extracted) {
          return null;
        }

        const Operator = <TExpectationOperatorConstructor<TContext>>this.operators[extracted.key];
        return new Operator(this.operators, extracted.nested);
      })(),
    }),
  };

  public match(context: TContext): boolean {
    const result = this.compiled.condition?.match(context) ?? false;
    return (result ? this.compiled.then?.match(context) : this.compiled.else?.match(context)) ?? false;
  }

  public manipulate<T extends TContext>(context: T): T {
    const result = this.compiled.condition?.match(context) ?? false;

    result ? this.compiled.then?.manipulate(context) : this.compiled.else?.manipulate(context);
    return context;
  }
}
