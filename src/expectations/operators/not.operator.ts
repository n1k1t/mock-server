import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import {
  IExpectationSchemaContext,
  IExpectationOperatorsSchema,
  TExpectationOperatorLocation,
  IExpectationMeta,
} from '../types';

export default class NotExpectationOperator<
  TContext extends IExpectationSchemaContext,
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

  public get tags(): IExpectationMeta['tags'] {
    return {};
  }

  public async match(context: TContext): Promise<boolean> {
    return this.compiled ? !(await this.compiled.match(context)) : false;
  }

  public async manipulate<T extends TContext>(context: T): Promise<T> {
    return context;
  }
}
