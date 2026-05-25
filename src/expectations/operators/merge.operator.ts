import merge from 'deepmerge';
import _ from 'lodash';

import { extractContextByLocation, extractWithJsonPathSafe } from '../utils';
import { ExpectationOperator } from '../models/operator';
import { TFunction } from '../../../types';
import {
  CompileExpectationOperatorValue,
  CompileExpectationOperatorValueWithPredicate,
  IExpectationSchemaContext,
  IExpectationExecUtils,
  TExpectationOperatorObjectLocation,
  IExpectationMeta,
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

  public get tags(): IExpectationMeta['tags'] {
    return {};
  }

  public async match(): Promise<boolean> {
    return true;
  }

  public async manipulate<T extends TContext>(context: T): Promise<T> {
    const payload = extractContextByLocation(this.command.$location, context);
    if (payload?.type !== 'object' || !_.isObject(payload.value)) {
      return context;
    }

    if (this.command.$path) {
      const value = _.get(payload.value, this.command.$path);
      const target = this.compiled.exec
        ? <object>(await this.compiled.exec('manipulate', context, value))
        : this.command.$value ?? {};

      _.set(
        payload.parent,
        `${payload.key}.${this.command.$path}`,
        merge(value, target, { arrayMerge: (target, source) => source })
      );

      return context;
    }

    if (this.command.$jsonPath) {
      const segments = extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value }).results ?? [];

      for (const segment of segments) {
        const value = _.get(segment.parent, segment.parentProperty);
        const target = this.compiled.exec
          ? <object>(await this.compiled.exec('manipulate', context, value))
          : this.command.$value ?? {};

        _.set(
          <object>payload.value,
          segment.pointer.substring(1).replace(/\//g, '.'),
          merge(value, target, { arrayMerge: (target, source) => source })
        );
      }

      return context;
    }

    const target = this.compiled.exec
      ? <object>(await this.compiled.exec('manipulate', context, payload.value))
      : this.command.$value ?? {};

    _.set(
      payload.parent,
      payload.key,
      merge(payload.value, target, { arrayMerge: (target, source) => source })
    );

    return context;
  }
}
