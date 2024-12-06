import { ValueError } from '@n1k1t/typebox/errors';

import { IExpectationOperatorContext, TExpectationContextLocation } from '../types';
import { Expectation, TBuildExpectationConfiguration } from './expectation';

export type TExpectationsStorageRegisterationResult =
  | { status: 'REGISTRED', expectation: Expectation<any> }
  | { status: 'ERROR', reasons: ValueError[] };

export class ExpectationsStorage extends Map<string, Expectation<any>> {
  public register(configuration: TBuildExpectationConfiguration<any>): TExpectationsStorageRegisterationResult {
    const expectation = Expectation.build(configuration);
    const errors = expectation.validate();

    if (errors.length) {
      return { status: 'ERROR', reasons: errors }
    }

    this.set(expectation.id, expectation);
    return { status: 'REGISTRED', expectation };
  }

  public match<TContext extends IExpectationOperatorContext<any>>(
    location: TExpectationContextLocation,
    context: TContext
  ): Expectation<TContext> | null {
    for (const expectation of this.values()) {
      if (expectation.isEnabled && expectation[location]?.match(context)) {
        return expectation.increaseExecutionsCounter();
      }
    }

    return null;
  }
}
