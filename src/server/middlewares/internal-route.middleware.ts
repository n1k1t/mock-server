import _ from 'lodash';

import { routes } from '../router';
import { Middleware } from '../models';

export default Middleware
  .build(__filename)
  .assignHandler((context, next) => {
    const key = [context.incoming.method, context.incoming.path].join(':');
    const endpoint = routes[context.type][key];

    return endpoint?.handler ? endpoint.handler(context) : next();
  });
