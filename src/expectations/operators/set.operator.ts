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

  public async match(): Promise<boolean> {
    return true;
  }

  public async manipulate<T extends TContext>(context: T): Promise<T> {
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
          this.compiled.exec
            ? await this.compiled.exec('manipulate', context, payload.value)
            : this.command.$value
        );

        return context;
      }

      case 'object': {
        if (this.command.$path) {
          _.set(
            payload.parent,
            `${payload.key}.${this.command.$path}`,
            this.compiled.exec
              ? await this.compiled.exec('manipulate', context, _.get(payload.value, this.command.$path))
              : this.command.$value
          );

          return context;
        }

        if (this.command.$jsonPath && _.isObject(payload.value)) {
          const segments = extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value }).results ?? [];

          for (const segment of segments) {
            const target = this.compiled.exec
              ? await this.compiled.exec('manipulate', context, segment.value)
              : this.command.$value

            _.set(segment.parent, segment.parentProperty, target);
          }

          return context;
        }

        _.set(
          payload.parent,
          payload.key,
          this.compiled.exec
            ? await this.compiled.exec('manipulate', context, payload.value)
            : this.command.$value
        );

        return context;
      }

      default: return context;
    }
  }
}
