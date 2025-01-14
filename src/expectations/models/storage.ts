import { ValueError } from '@n1k1t/typebox/errors';

import { IExpectationSchemaContext } from '../types';
import { Expectation } from './expectation';
import { Logger } from '../../logger';

export type TExpectationsStorageRegisterationResult =
  | { status: 'REGISTRED', expectation: Expectation<any> }
  | { status: 'ERROR', reasons: ValueError[] };

const logger = Logger.build('Expectations.Storage');

export class ExpectationsStorage extends Map<string, Expectation> {
  public register(configuration: Expectation['configuration']): TExpectationsStorageRegisterationResult {
    const expectation = Expectation.build<any>(configuration);
    const errors = expectation.validate();

    if (errors.length) {
      return { status: 'ERROR', reasons: errors }
    }

    logger.info(`Expectation [${expectation.name}] has registered in group [${expectation.group}]`);
    this.set(expectation.id, expectation);

    return { status: 'REGISTRED', expectation };
  }

  public match(context: IExpectationSchemaContext): Expectation<any> | null {
    for (const expectation of this.values()) {
      if (!expectation.isEnabled) {
        continue;
      }

      const hasSameTransport = expectation.transports?.includes(context.transport) ?? true;
      if (hasSameTransport && expectation.request.match(context)) {
        return expectation;
      }
    }

    return null;
  }
}
