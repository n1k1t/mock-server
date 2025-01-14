import _ from 'lodash';

import { Endpoint, Executor, IRequestContextOutgoing } from '../../../models';
import { InternalHttpRequestContext } from './context';
import { SetRequiredKeys } from '../../../../types';

import * as endpoints from '../../../endpoints';
import config from '../../../../config';

export class InternalHttpExecutor extends Executor<InternalHttpRequestContext> {
  public router = Object
    .values(endpoints)
    .reduce<Record<string, SetRequiredKeys<Endpoint['TCompiled'], 'http'>>>(
      (acc, endpoint) => endpoint.http ? _.set(acc, `${endpoint.http.method}:${endpoint.http.path}`, endpoint) : acc,
      {}
    );

  public async exec(context: InternalHttpRequestContext) {
    const routes = config.get('routes');

    const path = `${context.incoming.method}:${context.incoming.path.replace(routes.internal.root, '')}`;
    const endpoint = this.router[path] ?? (path.includes(routes.internal.gui) ? endpoints.gui : null);

    if (endpoint) {
      await endpoint.handler(context);
      return context.complete();
    }

    const outgoing = await this.reply(context);
    return context.assign({ outgoing }).complete();
  }

  public async handleExpectationMatch() {
    return null
  }

  public async forward() {
    return null;
  }

  public async reply(context: InternalHttpRequestContext) {
     const outgoing: IRequestContextOutgoing = {
      type: 'plain',
      status: 404,

      headers: {},
      dataRaw: 'Internal route was not found',
    };

    context.response.writeHead(outgoing.status);
    context.response.write(outgoing.dataRaw);
    context.response.end();

    return outgoing;
  }
}
