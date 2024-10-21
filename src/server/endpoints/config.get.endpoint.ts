import _ from 'lodash';
import { Endpoint } from '../models';

export interface IGetConfigResponsePayload {
  historyRecordsLimit: number;
}

export default Endpoint
  .build<IGetConfigResponsePayload>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/config' })
  .bindToWebSocket(<const>{ path: 'config:get' })
  .assignHandler(async ({ reply, config }) =>
    reply.ok({
      historyRecordsLimit: config.server.historyRecordsLimit,
    })
  );
