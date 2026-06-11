import _ from 'lodash';

import { Endpoint, Executor, IRequestContextOutgoing } from '../../../models';
import { SystemHttpRequestContext } from './context';

import * as endpoints from '../../../endpoints';
import config from '../../../../config';

type TEndpoint = Endpoint<{
  locations: {
    http: {
      method: string;
      path: string;
    };
  };

  incoming: any;
  outgoing: any;
}>;

export class SystemHttpExecutor extends Executor<SystemHttpRequestContext> {
  public router = Object.values(endpoints).reduce<Record<string, TEndpoint>>(
    (acc, endpoint) =>
      endpoint.locations.http
        ? _.set(acc, `${endpoint.locations.http.method}:${endpoint.locations.http.path}`, endpoint)
        : acc,
    {}
  );

  public async exec(context: SystemHttpRequestContext) {
    const routes = config.get('routes');

    const path = `${context.incoming.method}:${context.incoming.path.replace(routes.system.root, '')}`;
    const endpoint = this.router[path] ?? (path.includes(routes.system.gui) ? endpoints.gui : null);

    await endpoint?.handler?.(context);

    if (context.is(['completed'])) {
      return context;
    }

    const outgoing = await this.reply(context, context.outgoing);
    return context.assign({ outgoing }).complete();
  }

  public async match(context: SystemHttpRequestContext<unknown>) {
    await this.exec(context);
    return null;
  }

  public async forward() {
    return null;
  }

  public async reply(context: SystemHttpRequestContext, outgoing?: IRequestContextOutgoing) {
     const result = outgoing ?? {
      type: 'plain',
      status: 404,

      headers: {
        'content-type': 'text/plain',
      },

      raw: {
        data: Buffer.from('Internal route was not found'),
      },
    };

    context.response.writeHead(result.status, result.headers);
    context.response.write(result.raw.data ?? Buffer.from(''));
    context.response.end();

    return result;
  }
}
