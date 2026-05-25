import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import { mergeMetaTags } from '../utils';
import {
  IExpectationSchemaContext,
  IExpectationOperatorsSchema,
  TExpectationOperatorLocation,
  IExpectationMeta,
} from '../types';

export default class OrExpectationOperator<
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

  public get tags(): IExpectationMeta['tags'] {
    return mergeMetaTags(this.compiled.map((operator) => operator.tags));
  }

  public async match(context: TContext): Promise<boolean> {
    for (const operator of this.compiled) {
      if (await operator.match(context)) {
        return true;
      }
    }

    return false;
  }

  public async manipulate<T extends TContext>(context: T): Promise<T> {
    for (const operator of this.compiled) {
      await operator.manipulate(context);
    }

    return context;
  }
}
