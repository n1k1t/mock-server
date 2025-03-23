import dayjs from 'dayjs';

import { version } from '../../../package.json';
import { Endpoint } from '../models';

export default Endpoint
  .build<{
    outgoing: {
      version: string;
      uptime: string;
    };
  }>()
  .bindToHttp(<const>{ method: 'GET', path: '/stats' })
  .bindToIo(<const>{ path: 'stats' })
  .assignHandler((context) =>
    context.reply.ok({
      version,
      uptime: dayjs(context.server.timestamp).fromNow(true),
    })
  );
