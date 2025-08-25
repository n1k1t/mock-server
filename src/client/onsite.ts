import _ from 'lodash';

import type { TEndpoints, TMethodsSchema } from './types';
import type { Provider, IServerContext } from '../server';
import type { Expectation } from '../expectations';

import { Client } from './models';

import * as methods from './methods';

export class OnsiteClient<TContext extends IServerContext = IServerContext> extends Client<TContext> {
  constructor(provider: Provider<any>) {
    super(
      Object
        .entries(methods)
        .reduce((acc, [name, method]) => _.set(acc, name, method.compile('onsite', provider)), <TMethodsSchema>{})
    );
  }

  public async updateExpectationsGroup(
    body: NonNullable<TEndpoints['expectationsGroupUpdate']['incoming']['data']>['set']
  ): Promise<Expectation['TPlain'][]> {
    return this.methods.expectationsGroupUpdate({ set: body });
  }

  static build<TContext extends IServerContext = IServerContext>(provider: Provider<any>): OnsiteClient<TContext> {
    return new OnsiteClient<TContext>(provider);
  }
}
