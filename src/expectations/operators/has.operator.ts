import minimatch from 'minimatch';
import _ from 'lodash';

import { checkIsLocationInContext, extractContextByLocation } from '../utils';
import { extractWithJsonPathSafe } from '../../utils';
import { PartialDeep, TFunction } from '../../types';
import { ExpectationOperator } from '../models/operator';
import {
  CompileExpectationOperatorValue,
  CompileExpectationOperatorValueWithPredicate,
  IExpectationOperatorContext,
  IExpectationOperatorExecUtils,
  TExpectationOperatorLocation,
} from '../types';

export default class HasExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TValue = void
> extends ExpectationOperator<
  TContext,
  {
    [K in TLocation]: {
      $location: K;

      $path?: string;
      $jsonPath?: string;

      $regExp?: RegExp;
      $regExpAnyOf?: RegExp[];

      $match?: NonNullable<CompileExpectationOperatorValue<TContext, K, TValue>> extends object
        ? PartialDeep<NonNullable<CompileExpectationOperatorValue<TContext, K, TValue>>>
        : string;

      $matchAnyOf?: (
        NonNullable<CompileExpectationOperatorValue<TContext, K, TValue>> extends object
          ? PartialDeep<NonNullable<CompileExpectationOperatorValue<TContext, K, TValue>>>
          : string
      )[];

      $value?: CompileExpectationOperatorValueWithPredicate<TContext, K, TValue>;
      $valueAnyOf?: CompileExpectationOperatorValueWithPredicate<TContext, K, TValue>[];

      $exec?: string | TFunction<boolean, [
        CompileExpectationOperatorValue<TContext, K, TValue>,
        IExpectationOperatorExecUtils<TContext>
      ]>;
    };
  }[TLocation]
> {
  public compiled = {
    ...(this.command.$regExp && {
      regExp: new RegExp(this.command.$regExp.source, this.command.$regExp.flags)
    }),

    ...(this.command.$regExpAnyOf && {
      regExpAnyOf: this.command.$regExpAnyOf.map((exp) => new RegExp(exp.source, exp.flags)),
    }),

    ...(this.command.$exec && {
      exec: this.compileExecHandler(this.command.$exec, ['payload', 'utils']),
    }),
  };

  public match(context: TContext): boolean {
    if (!checkIsLocationInContext(this.command.$location, context)) {
      return false;
    }

    const payload = extractContextByLocation(this.command.$location, context);
    if (!payload) {
      return false;
    }

    switch(payload.type) {
      case 'string': {
        if (this.command.$value !== undefined) {
          return payload.value === this.command.$value;
        }
        if (this.command.$valueAnyOf) {
          return this.command.$valueAnyOf.some((value) => payload.value === value);
        }

        if (this.compiled.regExp) {
          return this.compiled.regExp.test(payload.value ?? '');
        }
        if (this.compiled.regExpAnyOf) {
          return this.compiled.regExpAnyOf.some((regExp) => regExp.test(payload.value ?? ''));
        }

        if (typeof this.command.$match === 'string') {
          return minimatch(payload.value ?? '', this.command.$match);
        }
        if (this.command.$matchAnyOf) {
          return this.command.$matchAnyOf.some((pattern) => minimatch(payload.value ?? '', String(pattern)));
        }

        if (this.compiled.exec) {
          return this.compiled.exec('match', context, payload.value) === true;
        }
      }

      case 'number': {
        if (this.command.$value !== undefined) {
          return payload.value === this.command.$value;
        }
        if (this.command.$valueAnyOf) {
          return this.command.$valueAnyOf.some((value) => payload.value === value);
        }

        if (typeof this.command.$match === 'string') {
          return minimatch(String(payload.value), this.command.$match);
        }
        if (this.command.$matchAnyOf) {
          const value = String(payload.value);
          return this.command.$matchAnyOf.some((pattern) => minimatch(value, String(pattern)));
        }

        if (this.compiled.exec) {
          return this.compiled.exec('match', context, payload.value) === true;
        }
      }

      case 'object': {
        if (this.command.$path && !_.has(payload.value, this.command.$path)) {
          return false;
        }

        const values = (
          this.command.$path
            ? [_.get(payload.value, this.command.$path)]
            : (this.command.$jsonPath && _.isObject(payload.value))
            ? extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value }).results?.map(({ value }) => value)
            : [payload.value]
        ) ?? [];

        if (this.command.$value !== undefined) {
          return values.every((value) => _.isEqual(this.command.$value, value));
        }
        if (this.command.$valueAnyOf) {
          return values.every((source) => this.command.$valueAnyOf!.some((target) => _.isEqual(source, target)));
        }

        if (this.compiled.regExp) {
          return values.every((value) => this.compiled.regExp!.test(String(value)));
        }
        if (this.compiled.regExpAnyOf) {
          return values.every((value) => this.compiled.regExpAnyOf!.some((exp) => exp.test(String(value))));
        }

        if (typeof this.command.$match === 'string') {
          return values.every((value) => minimatch(String(value), <string>this.command.$match));
        }
        if (typeof this.command.$match === 'object') {
          return values.every((value) => _.isMatch(value, <object>this.command.$match));
        }

        if (typeof this.command.$matchAnyOf?.[0] === 'string') {
          return values.every((value) => this.command.$matchAnyOf!.some((pattern) => minimatch(String(value), String(pattern))));
        }
        if (typeof this.command.$matchAnyOf?.[0] === 'object') {
          return values.every((value) => this.command.$matchAnyOf!.some((target) => _.isMatch(value, <object>target)));
        }

        if (this.compiled.exec) {
          return values.every((value) => this.compiled.exec!('match', context, value) === true);
        }

        return values.length !== 0;
      }

      default: return false;
    }
  }

  public manipulate<T extends TContext>(context: T): T {
    return context;
  }
}
