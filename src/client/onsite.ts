import _ from 'lodash';

import type { ServerContext } from '../server/models';
import type { TMethodsSchema } from './types';

import * as methods from './methods';

export class OnsiteClient {
  static build(context: ServerContext) {
    const client = new OnsiteClient();
    const compiled: TMethodsSchema = Object
      .entries(methods)
      .reduce((acc, [name, method]) => _.set(acc, name, method.compile('onsite', context)), <TMethodsSchema>{});

    return Object.assign(client, compiled);
  }
}
