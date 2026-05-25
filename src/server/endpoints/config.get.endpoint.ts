import _ from 'lodash';

import { EndpointFactory } from '../models';
import config from '../../config';

export default EndpointFactory
  .build<{ outgoing: Pick<typeof config['storage'], 'history'> }>()
  .http(<const>{ method: 'GET', path: `/config` })
  .io(<const>{ path: 'config:get' })
  .compile(({ reply }) => reply.ok(_.pick(config.storage, ['history'])));
