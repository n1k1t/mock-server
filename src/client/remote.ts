import axios from 'axios';
import _ from 'lodash';

import { IRemoteClientConnectOptions, TMethodsSchema } from './types';
import { Client } from './models';

import * as methods from './methods';

export class RemoteClient extends Client {
  constructor(public options: IRemoteClientConnectOptions) {
    const instance = axios.create({
      baseURL: `http://${options.host}:${options.port}`,
      timeout: options.timeout ?? 1000 * 10,
    });

    super(
      Object
        .entries(methods)
        .reduce((acc, [name, method]) => _.set(acc, name, method.compile('remote', instance)), <TMethodsSchema>{})
    );
  }

  static async connect(options: IRemoteClientConnectOptions) {
    const client = new RemoteClient(options);

    await client.ping();
    return client;
  }
}
