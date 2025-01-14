import _ from 'lodash';

import config, { Config } from '../../config';
import { Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: Pick<Config['storage'], 'history'> }>()
  .bindToHttp(<const>{ method: 'GET', path: `/config` })
  .bindToIo(<const>{ path: 'config:get' })
  .assignHandler(async ({ reply }) => reply.ok(_.pick(config.storage, ['history'])))
  .compile();
