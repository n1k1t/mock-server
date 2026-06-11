import _ from 'lodash';

import { Endpoint, Executor, IRequestContextOutgoing } from '../../../models';
import { SystemSocketIoRequestContext } from './context';

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

export class SystemSocketIoExecutor extends Executor<SystemSocketIoRequestContext> {
  public endpoints = Object.values(endpoints).reduce<Record<string, TEndpoint>>(
    (acc, endpoint) => endpoint.locations.io ? _.set(acc, endpoint.locations.io.path, endpoint) : acc,
    {}
  );

  public async exec(context: SystemSocketIoRequestContext) {
    await this.endpoints[context.incoming.path]?.handler?.(context);
    return context.complete();
  }

  public async forward() {
    return null;
  }

  public async reply(): Promise<IRequestContextOutgoing> {
    return { type: 'plain', status: 200, headers: {}, raw: {} };
  }
}
