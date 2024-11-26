import _ from 'lodash';

import config from '../../config';
import { Endpoint } from '../models';

export default Endpoint
  .build<typeof config['storage']>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/config' })
  .bindToWs(<const>{ path: 'config:get' })
  .assignHandler(async ({ reply }) => reply.ok(config.storage));
