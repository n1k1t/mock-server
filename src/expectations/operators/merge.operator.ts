import merge from 'deepmerge';
import _ from 'lodash';

import { extractContextByLocation } from '../utils';
import { extractWithJsonPathSafe } from '../../utils';
import { ExpectationOperator } from '../models/operator';
import {
  CompileExpectationOperatorValueWithPredicate,
  IExpectationOperatorContext,
  TExpectationOperatorLocation,
} from '../types';

export default class MergeExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation,
  TValue = void
> extends ExpectationOperator<
  TContext,
  {
    [K in TLocation]: {
      $location: K;
      $value: CompileExpectationOperatorValueWithPredicate<TContext, K, TValue>;

      $path?: string;
      $jsonPath?: string;
    }
  }[TLocation]
> {
  public match(): boolean {
    return true;
  }

  public manipulate<T extends TContext>(context: T): T {
    const payload = extractContextByLocation(this.command.$location, context);
    if (payload?.type !== 'object') {
      return context;
    }

    if (this.command.$path) {
      _.set(
        payload.value,
        this.command.$path,
        merge(_.get(payload.value, this.command.$path), <object>this.command.$value ?? {})
      );

      return context;
    }

    if (this.command.$jsonPath) {
      extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value })
        .results?.forEach(
          (segment) => _.set(
            payload.value,
            segment.pointer.substring(1).replace(/\//g, '.'),
            merge(_.get(segment.parent, segment.parentProperty), <object>this.command.$value ?? {})
          )
        );

      return context;
    }

    _.set(payload.parent, payload.key, merge(payload.value, <object>this.command.$value ?? {}));
    return context;
  }
}
