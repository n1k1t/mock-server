import _ from 'lodash';

import { compileMetaTagsAccumulator, extractContextByLocation, extractWithJsonPathSafe } from '../utils';
import { ExpectationOperator } from '../models/operator';
import { TFunction } from '../../../types';
import {
  CompileExpectationOperatorValue,
  CompileExpectationOperatorValueWithPredicate,
  IExpectationSchemaContext,
  IExpectationExecUtils,
  TExpectationOperatorLocation,
  IExpectationMeta,
} from '../types';

export default class SetExpectationOperator<
  TContext extends IExpectationSchemaContext,
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
        IExpectationExecUtils<TContext>
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

  public get tags(): IExpectationMeta['tags'] {
    const acc = compileMetaTagsAccumulator(this.command.$location);
    if (!acc) {
      return {};
    }

    return this.command.$value !== undefined
      ? acc([this.command.$value])
      : {};
  }

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
      case 'buffer':
      case 'string': {
        _.set(
          payload.parent,
          payload.key,
          this.compiled.exec ? this.compiled.exec('manipulate', context, payload.value) : this.command.$value
        );

        return context;
      }

      case 'object': {
        if (this.command.$path) {
          _.set(
            payload.parent,
            `${payload.key}.${this.command.$path}`,
            this.compiled.exec
              ? this.compiled.exec('manipulate', context, _.get(payload.value, this.command.$path))
              : this.command.$value
          );

          return context;
        }

        if (this.command.$jsonPath && _.isObject(payload.value)) {
          extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value }).results?.forEach(
            ({ parent, parentProperty, value }) => this.compiled.exec
              ? _.set(parent, parentProperty, this.compiled.exec('manipulate', context, value))
              : _.set(parent, parentProperty, this.command.$value)
          );

          return context;
        }

        _.set(
          payload.parent,
          payload.key,
          this.compiled.exec ? this.compiled.exec('manipulate', context, payload.value) : this.command.$value
        );

        return context;
      }

      default: return context;
    }
  }
}
