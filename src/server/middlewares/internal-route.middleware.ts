import _ from 'lodash';

import { resolveInternalEndpoint } from '../router';
import { Middleware } from '../models';

export default Middleware
  .build(__filename)
  .assignHandler((content, next) => {
    const endpoint = resolveInternalEndpoint(content);
    return endpoint ? endpoint.handle() : next();
  });
