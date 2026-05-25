import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import { mergeMetaTags } from '../utils';
import {
  IExpectationSchemaContext,
  IExpectationOperatorsSchema,
  TExpectationOperatorLocation,
  IExpectationMeta,
} from '../types';

export default class IfExpectationOperator<
  TContext extends IExpectationSchemaContext,
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

  public get tags(): IExpectationMeta['tags'] {
    return mergeMetaTags([
      this.compiled.condition?.tags ?? {},
      this.compiled.then?.tags ?? {},
      this.compiled.else?.tags ?? {},
    ]);
  }

  public async match(context: TContext): Promise<boolean> {
    const matched = await this.compiled.condition?.match(context) ?? false;
    const result = matched
      ? await this.compiled.then?.match(context)
      : await this.compiled.else?.match(context)

    return result ?? false;
  }

  public async manipulate<T extends TContext>(context: T): Promise<T> {
    const result = await this.compiled.condition?.match(context) ?? false;

    result
      ? await this.compiled.then?.manipulate(context)
      : await this.compiled.else?.manipulate(context);

    return context;
  }
}
