import _ from 'lodash';

import { Endpoint } from '../models';
import config from '../../config';

export default Endpoint
  .build<{ outgoing: Pick<typeof config['storage'], 'history'> }>()
  .bindToHttp(<const>{ method: 'GET', path: `/config` })
  .bindToIo(<const>{ path: 'config:get' })
  .assignHandler(({ reply }) => reply.ok(_.pick(config.storage, ['history'])));
