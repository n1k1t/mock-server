import _ from 'lodash';

import { Endpoint, Executor, IRequestContextOutgoing } from '../../../models';
import { InternalSocketIoRequestContext } from './context';

import * as endpoints from '../../../endpoints';

type TEndpoint = Endpoint<{
  locations: {
    io: {
      path: string;
    };
  };

  incoming: any;
  outgoing: any;
}>;

export class InternalSocketIoExecutor extends Executor<InternalSocketIoRequestContext> {
  public endpoints = Object.values(endpoints).reduce<Record<string, TEndpoint>>(
    (acc, endpoint) => endpoint.locations.io ? _.set(acc, endpoint.locations.io.path, endpoint) : acc,
    {}
  );

  public async exec(context: InternalSocketIoRequestContext) {
    await this.endpoints[context.incoming.path]?.handler?.(context);
    return context.complete();
  }

  public async forward() {
    return null;
  }

  public async reply(): Promise<IRequestContextOutgoing> {
    return { type: 'plain', status: 200, headers: {} };
  }
}
