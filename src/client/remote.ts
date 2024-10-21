import axios from 'axios';
import _ from 'lodash';

import { IRemoteClientConnectOptions, TMethodsSchema } from './types';
import * as methods from './methods';

export class RemoteClient {
  public instance = axios.create({
    baseURL: `http://${this.options.host}:${this.options.port}`,
    timeout: this.options.timeout ?? 1000 * 10,
  });

  constructor(public options: IRemoteClientConnectOptions) {}

  static async connect(options: IRemoteClientConnectOptions) {
    const client = new RemoteClient(options);
    const compiled: TMethodsSchema = Object
      .entries(methods)
      .reduce((acc, [name, method]) => _.set(acc, name, method.compile('remote', client.instance)), <TMethodsSchema>{});

    await compiled.ping();
    return Object.assign(client, compiled);
  }
}
