import _ from 'lodash';

import { Endpoint } from './model';
import { serverConfig } from '../../config';

export interface IGetConfigResponsePayload {
  historyRecordsLimit: number;
}

export default Endpoint
  .build<IGetConfigResponsePayload>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/config' })
  .bindToWebSocket(<const>{ path: 'config:get' })
  .assignHandler(async ({ reply }) =>
    reply.ok({
      historyRecordsLimit: serverConfig.historyRecordsLimit,
    })
  );
