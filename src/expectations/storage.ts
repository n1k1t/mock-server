import { ValueError } from '@n1k1t/typebox/errors';

import { Expectation } from './model';
import { TExpectationContext, TExpectationContextLocation } from './types';

export type TExpectationsStorageRegisterationResult =
  | { status: 'REGISTRED', expectation: Expectation }
  | { status: 'ERROR', reasons: ValueError[] };

export class ExpectationsStorage extends Map<string, Expectation> {
  public register(configuration: Parameters<typeof Expectation['build']>[1]): TExpectationsStorageRegisterationResult {
    const expectation = Expectation.build('HTTP', configuration);
    const errors = expectation.validate();

    if (errors.length) {
      return { status: 'ERROR', reasons: errors }
    }

    this.set(expectation.id, expectation);
    return { status: 'REGISTRED', expectation };
  }

  public findByContext(location: TExpectationContextLocation, context: TExpectationContext): Expectation | null {
    for (const expectation of this.values()) {
      if (expectation.isEnabled && expectation.validateContext(location, context)) {
        return expectation;
      }
    }

    return null;
  }

  public findAndManipulateContext<T extends TExpectationContext>(
    location: TExpectationContextLocation,
    context: T,
    options?: Parameters<Expectation['manipulateContext']>[2]
  ): { context: T, expectation: Expectation } | null {
    const expectation = this.findByContext(location, context);
    if (!expectation) {
      return null;
    }

    return {
      expectation,
      context: expectation.manipulateContext(location, context, options),
    }
  }
}
