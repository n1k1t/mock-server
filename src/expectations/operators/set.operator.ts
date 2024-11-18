import _ from 'lodash';

import { extractContextByLocation } from '../utils';
import { extractWithJsonPathSafe } from '../../utils';
import { ExpectationOperator } from '../models/operator';
import {
  CompileExpectationOperatorValue,
  CompileExpectationOperatorValueWithPredicate,
  IExpectationOperatorContext,
  IExpectationOperatorExecUtils,
  TExpectationOperatorLocation,
} from '../types';

export default class SetExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TValue = void
> extends ExpectationOperator<
  TContext,
  {
    [K in TLocation]: {
      $location: K;

      $value?: CompileExpectationOperatorValueWithPredicate<TContext, K, TValue>;
      $exec?: string | TFunction<CompileExpectationOperatorValueWithPredicate<TContext, K, TValue>, [
        CompileExpectationOperatorValue<TContext, K, TValue>,
        IExpectationOperatorExecUtils<TContext>
      ]>;

      $path?: string;
      $jsonPath?: string;
    }
  }[TLocation]
> {
  public compiled = {
    ...(this.command.$exec && {
      exec: this.compileExecHandler(this.command.$exec, ['payload', 'utils']),
    }),
  };

  public match(): boolean {
    return true;
  }

  public manipulate<T extends TContext>(context: T): T {
    const payload = extractContextByLocation(this.command.$location, context);
    if (!payload) {
      return context;
    }

    switch(payload.type) {
      case 'number':
      case 'string': {
        this.compiled.exec
          ? _.set(payload.parent, payload.key, this.compiled.exec(context, payload.value))
          : _.set(payload.parent, payload.key, this.command.$value);

        return context;
      }

      case 'object': {
        if (this.command.$path) {
          this.compiled.exec
            ? _.set(payload.value, this.command.$path, this.compiled.exec(context, _.get(payload.value, this.command.$path)))
            : _.set(payload.value, this.command.$path, this.command.$value);

          return context;
        }

        if (this.command.$jsonPath) {
          extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value }).results?.forEach(
            ({ parent, parentProperty, value }) => this.compiled.exec
              ? _.set(parent, parentProperty, this.compiled.exec(context, value))
              : _.set(parent, parentProperty, this.command.$value)
          );

          return context;
        }

        _.set(payload.parent, [payload.key], this.command.$value);
        return context;
      }

      default: return context;
    }
  }
}
