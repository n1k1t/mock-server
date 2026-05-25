import dayjs from 'dayjs';

import { EndpointFactory } from '../models';
import { version } from '../../../package.json';

export default EndpointFactory
  .build<{
    outgoing: {
      version: string;
      uptime: string;
    };
  }>()
  .http(<const>{ method: 'GET', path: '/stats' })
  .io(<const>{ path: 'stats' })
  .compile((context) =>
    context.reply.ok({
      version,
      uptime: dayjs(context.server.timestamp).fromNow(true),
    })
  );
