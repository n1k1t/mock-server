import { createReadStream } from 'fs';
import path from 'path';
import fs from 'fs/promises';
import _ from 'lodash';

import { Endpoint, IRequestContextOutgoing } from '../models';
import config from '../../config';

export default Endpoint
  .build<{ outgoing: string }>()
  .bindToHttp(<const>{ method: 'GET', path: '/gui' })
  .assignHandler(async (context) => {
    if (context.transport !== 'http') {
      return context.reply.notFound();
    }

    const routes = config.get('routes');
    const statics = config.get('statics');

    if (!context.incoming.path.includes(routes.internal.gui)) {
      return context.assign({ outgoing: { type: 'plain', status: 404, headers: {} } });
    }

    const root = routes.internal.root + routes.internal.gui;
    const parsed = path.parse(context.incoming.path.replace(root, ''));

    if (!parsed.dir) {
      return context.assign({
        outgoing: {
          type: 'plain',
          status: 301,

          headers: {
            Location: path.join(root, '/'),
          },
        },
      });
    }

    if (parsed.dir === '/' && !parsed.ext) {
      const outgoing: IRequestContextOutgoing = {
        type: 'plain',
        status: 200,

        headers: {
          'Content-Type': 'text/html;charset=utf-8',
        },
      };

      context.response.writeHead(outgoing.status, outgoing.headers);
      createReadStream(path.join(statics.public.dir, '/index.html')).pipe(context.response);

      return context.assign({ outgoing }).complete();
    }

    const stats = await fs.stat(path.join(statics.public.dir, parsed.dir, parsed.base)).catch(() => null);

    if (!stats) {
      return context.assign({ outgoing: { type: 'plain', status: 404, headers: {} } });
    }

    createReadStream(path.join(statics.public.dir, parsed.dir, parsed.base)).pipe(context.response);
    return context.assign({ outgoing: { type: 'plain', status: 200, headers: {} } }).complete();
  });
