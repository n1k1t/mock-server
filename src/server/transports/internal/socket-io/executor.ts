import _ from 'lodash';

import { Endpoint, Executor, IRequestContextOutgoing } from '../../../models';
import { InternalSocketIoRequestContext } from './context';
import { SetRequiredKeys } from '../../../../types';

import * as endpoints from '../../../endpoints';

export class InternalSocketIoExecutor extends Executor<InternalSocketIoRequestContext> {
  public endpoints = Object
    .values(endpoints)
    .reduce<Record<string, SetRequiredKeys<Endpoint, 'io'>>>(
      (acc, endpoint) => endpoint.io ? _.set(acc, endpoint.io.path, endpoint) : acc,
      {}
    );

  public async exec(context: InternalSocketIoRequestContext) {
    await this.endpoints[context.incoming.path]?.handler?.(context);
    return context.complete();
  }

  public async handleExpectationMatch() {
    return null
  }

  public async forward() {
    return null;
  }

  public async reply(): Promise<IRequestContextOutgoing> {
    return { type: 'plain', status: 200, headers: {} };
  }
}
