import merge from 'deepmerge';
import _ from 'lodash';

import { extractContextByLocation } from '../utils';
import { extractWithJsonPathSafe } from '../../utils';
import { ExpectationOperator } from '../models/operator';
import { TFunction } from '../../types';
import {
  CompileExpectationOperatorValue,
  CompileExpectationOperatorValueWithPredicate,
  IExpectationSchemaContext,
  IExpectationExecUtils,
  TExpectationMetaTag,
  TExpectationOperatorObjectLocation,
} from '../types';

export default class MergeExpectationOperator<
  TContext extends IExpectationSchemaContext,
  TLocation extends TExpectationOperatorObjectLocation = TExpectationOperatorObjectLocation,
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

  public get tags(): TExpectationMetaTag[] {
    return [];
  }

  public match(): boolean {
    return true;
  }

  public manipulate<T extends TContext>(context: T): T {
    const payload = extractContextByLocation(this.command.$location, context);
    if (payload?.type !== 'object' || !_.isObject(payload.value)) {
      return context;
    }

    if (this.command.$path) {
      const value = _.get(payload.value, this.command.$path);

      _.set(
        payload.parent,
        `${payload.key}.${this.command.$path}`,
        this.compiled.exec
          ? merge(value, this.compiled.exec('manipulate', context, value), { arrayMerge: (target, source) => source })
          : merge(value, <object>this.command.$value ?? {}, { arrayMerge: (target, source) => source })
      );

      return context;
    }

    if (this.command.$jsonPath) {
      extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value }).results?.forEach((segment) => {
        const value = _.get(segment.parent, segment.parentProperty);

        _.set(
          <object>payload.value,
          segment.pointer.substring(1).replace(/\//g, '.'),
          this.compiled.exec
            ? merge(value, this.compiled.exec('manipulate', context, value))
            : merge(value, this.command.$value ?? {})
        )
      });

      return context;
    }

    _.set(
      payload.parent,
      payload.key,
      this.compiled.exec
        ? merge(payload.value, this.compiled.exec('manipulate', context, payload.value))
        : merge(payload.value, this.command.$value ?? {})
    );

    return context;
  }
}
