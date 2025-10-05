import _ from 'lodash';

import { compileMetaTagsAccumulator, extractContextByLocation, mergeMetaTags } from '../utils';
import { ExpectationOperator, TExpectationOperatorConstructor } from '../models/operator';
import { TFunction } from '../../../types';
import {
  CompileExpectationOperatorValue,
  IExpectationSchemaContext,
  IExpectationExecUtils,
  IExpectationOperatorsSchema,
  TExpectationOperatorLocation,
  IExpectationMeta,
} from '../types';

export default class SwitchExpectationOperator<
  TContext extends IExpectationSchemaContext,
  TPickLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TPickValue = void,
  TForwardLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TForwardValue = void
> extends ExpectationOperator<
  TContext,
  {
    [K in TPickLocation]: {
      $location: K;

      $cases: Partial<
        Record<
          Extract<CompileExpectationOperatorValue<TContext, K, TPickValue>, number | string> extends never
            ? (number | string)
            : Extract<CompileExpectationOperatorValue<TContext, K, TPickValue>, number | string>,
          IExpectationOperatorsSchema<TContext, TForwardLocation, TForwardValue>
        >
      >;

      $default?: IExpectationOperatorsSchema<TContext, TForwardLocation, TForwardValue>;
      $path?: string;

      $exec?: string | TFunction<unknown, [
        CompileExpectationOperatorValue<TContext, K, TPickValue>,
        IExpectationExecUtils<TContext>
      ]>;
    }
  }[TPickLocation]
> {
  public compiled = {
    cases: Object
      .entries(this.command.$cases)
      .reduce<Record<string | number, ExpectationOperator<any, any>>>((acc, [key, schema]) => {
        const extracted = this.extractNestedSchema(<IExpectationOperatorsSchema<any, any>>schema);
        if (!extracted) {
          return acc;
        }

        const Operator = <TExpectationOperatorConstructor<TContext>>this.operators[extracted.key];
        return _.set(acc, key, new Operator(this.operators, extracted.nested));
      }, {}),

    ...(this.command.$default && {
      default: (() => {
        const extracted = this.extractNestedSchema(this.command.$default);
        if (!extracted) {
          return null;
        }

        const Operator = <TExpectationOperatorConstructor<TContext>>this.operators[extracted.key];
        return new Operator(this.operators, extracted.nested);
      })(),
    }),

    ...(this.command.$exec && {
      exec: this.compileExecHandler(this.command.$exec, ['payload', 'utils']),
    }),
  };

  public get tags(): IExpectationMeta['tags'] {
    const acc = compileMetaTagsAccumulator(this.command.$location);

    return mergeMetaTags([
      acc?.(Object.keys(this.compiled.cases)) ?? {},
      this.compiled.default?.tags ?? {},

      ...Object.values(this.compiled.cases).map((operator) => operator.tags),
    ]);
  }

  public match(context: TContext): boolean {
    const operator = this.handle(context);
    return operator?.match(context) ?? false;
  }

  public manipulate<T extends TContext>(context: T): T {
    const operator = this.handle(context);

    operator?.manipulate(context);
    return context;
  }

  private handle<T extends TContext>(context: T): ExpectationOperator<any, any> | null {
    const value = this.extractValue(context);
    if (value === null) {
      return this.compiled.default ?? null;
    }

    return _.get(this.compiled.cases, String(value)) ?? this.compiled.default ?? null;
  }

  private extractValue<T extends TContext>(context: T): unknown {
    const payload = extractContextByLocation(this.command.$location, context);
    if (!payload) {
      return null;
    }

    if (this.compiled.exec) {
      return this.compiled.exec('match', context, payload.value);
    }

    return this.command.$path
      ? payload.type === 'object' ? _.get(payload.value, this.command.$path) : payload.value
      : payload.value;
  }
}
