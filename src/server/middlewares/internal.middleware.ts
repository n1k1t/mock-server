import _ from 'lodash';

import { Middleware } from '../models';
import { routes } from '../router';

export default Middleware
  .build(__filename)
  .assignHandler(async (context) => {
    const key = [context.incoming.method, context.incoming.path].join(':');
    const endpoint = routes[context.type][key];

    if (endpoint?.handler) {
      await endpoint.handler(context);
      context.complete();
    }
  });
