import axios from 'axios';
import _ from 'lodash';

import type { IRemoteClientConnectOptions, TMethodsSchema } from './types';
import type { IServerContext, IServerContextDefaults } from '../server/types';

import { Client } from './models';

import * as methods from './methods';

export class RemoteClient<TContext extends IServerContext = any> extends Client<TContext> {
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

  public get updateExpectationsGroup() {
    return this.methods.expectationsGroupUpdate;
  }

  public get createProvider() {
    return this.methods.providersCreate;
  }

  public get deleteProvider() {
    return this.methods.providersDelete;
  }

  static async connect<TContext extends IServerContext = IServerContextDefaults>(
    options: IRemoteClientConnectOptions
  ): Promise<RemoteClient<TContext>> {
    const client = new RemoteClient<TContext>(options);

    await client.ping();
    return client;
  }
}
