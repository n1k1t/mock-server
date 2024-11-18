import _ from 'lodash';
import { Endpoint } from '../models';

export interface IGetConfigResponsePayload {
  historyRecordsLimit: number;
}

export default Endpoint
  .build<IGetConfigResponsePayload>()
  .bindToHttp(<const>{ method: 'GET', path: '/_mock/config' })
  .bindToWs(<const>{ path: 'config:get' })
  .assignHandler(async ({ reply, server }) =>
    reply.ok({ historyRecordsLimit: server.config.server.historyRecordsLimit })
  );
