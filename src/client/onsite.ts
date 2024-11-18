import _ from 'lodash';

import type { ServerContext } from '../server/models';
import type { TMethodsSchema } from './types';
import { Client } from './models';

import * as methods from './methods';

export class OnsiteClient extends Client {
  constructor(context: ServerContext) {
    super(
      Object
        .entries(methods)
        .reduce((acc, [name, method]) => _.set(acc, name, method.compile('onsite', context)), <TMethodsSchema>{})
    );
  }

  static build(context: ServerContext) {
    return new OnsiteClient(context);
  }
}
