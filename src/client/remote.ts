import axios from 'axios';
import _ from 'lodash';

import { IRemoteClientConnectOptions, TMethodsSchema } from './types';
import { IServerContext, TDefaultServerContext } from '../server/types';
import { Client } from './models';

import * as methods from './methods';

export class RemoteClient<TContext extends IServerContext<any> = TDefaultServerContext> extends Client<TContext> {
  get updateExpectationsGroup() {
    return this.methods.updateExpectationsGroup;
  }

  constructor(public options: IRemoteClientConnectOptions) {
    const instance = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeout ?? 1000 * 10,
    });

    super(
      Object
        .entries(methods)
        .reduce((acc, [name, method]) => _.set(acc, name, method.compile('remote', instance)), <TMethodsSchema>{})
    );
  }

  static async connect<TContext extends IServerContext<any> = TDefaultServerContext>(options: IRemoteClientConnectOptions) {
    const client = new RemoteClient<TContext>(options);

    await client.ping();
    return client;
  }
}
