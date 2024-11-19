import _ from 'lodash';

import { IExpectationOperatorContext, TExpectationOperatorLocation } from '../types';
import { extractContextByLocation } from '../utils';
import { extractWithJsonPathSafe } from '../../utils';
import { ExpectationOperator } from '../models/operator';

export default class RemoveExpectationOperator<
  TContext extends PartialDeep<IExpectationOperatorContext> = {},
  TLocation extends TExpectationOperatorLocation = TExpectationOperatorLocation
> extends ExpectationOperator<
  TContext,
  {
    [K in TLocation]: {
      $location: K;

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
      _.unset(payload.value, this.command.$path);
      return context;
    }

    if (this.command.$jsonPath && _.isObject(payload.value)) {
      extractWithJsonPathSafe({ path: this.command.$jsonPath, json: payload.value })
        .results?.forEach((segment) => _.unset(segment.parent, segment.parentProperty));

      return context;
    }

    _.unset(payload.parent, payload.key);
    return context;
  }
}
