import _ from 'lodash';

import { resolveInternalEndpoint } from '../router';
import { Middleware } from './model';

export default Middleware
  .build(__filename)
  .assignHandler((content, next) => {
    const endpoint = resolveInternalEndpoint(content);
    return endpoint ? endpoint.handle() : next();
  });
