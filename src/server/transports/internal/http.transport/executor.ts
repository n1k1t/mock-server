import _ from 'lodash';

import { Endpoint, Executor, IRequestContextOutgoing } from '../../../models';
import { InternalHttpRequestContext } from './context';

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

export class InternalHttpExecutor extends Executor<InternalHttpRequestContext> {
  public router = Object.values(endpoints).reduce<Record<string, TEndpoint>>(
    (acc, endpoint) =>
      endpoint.locations.http
        ? _.set(acc, `${endpoint.locations.http.method}:${endpoint.locations.http.path}`, endpoint)
        : acc,
    {}
  );

  public async exec(context: InternalHttpRequestContext) {
    const routes = config.get('routes');

    const path = `${context.incoming.method}:${context.incoming.path.replace(routes.internal.root, '')}`;
    const endpoint = this.router[path] ?? (path.includes(routes.internal.gui) ? endpoints.gui : null);

    await endpoint?.handler?.(context);

    if (context.is(['completed'])) {
      return context;
    }

    const outgoing = await this.reply(context, context.outgoing);
    return context.assign({ outgoing }).complete();
  }

  public async match(context: InternalHttpRequestContext<unknown>) {
    await this.exec(context);
    return null;
  }

  public async forward() {
    return null;
  }

  public async reply(context: InternalHttpRequestContext, outgoing?: IRequestContextOutgoing) {
     const result = outgoing ?? {
      type: 'plain',
      status: 404,

      headers: {},
      data: 'Internal route was not found',
    };

    context.response.writeHead(result.status, result.headers);
    context.response.write(result.dataRaw ?? '');
    context.response.end();

    return result;
  }
}
