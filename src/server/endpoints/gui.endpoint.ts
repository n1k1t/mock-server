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
      const outgoing: IRequestContextOutgoing = { type: 'plain', status: 404, headers: {} };

      context.response.writeHead(outgoing.status).end();
      return context.assign({ outgoing });
    }

    const root = routes.internal.root + routes.internal.gui;
    const parsed = path.parse(context.incoming.path.replace(root, ''));

    if (!parsed.dir) {
      const outgoing: IRequestContextOutgoing = {
        type: 'plain',
        status: 301,

        headers: {
          Location: path.join(root, '/'),
        },
      };

      context.response.writeHead(outgoing.status, undefined, outgoing.headers);
      return context.assign({ outgoing });
    }

    if (parsed.dir === '/' && !parsed.ext) {
      const outgoing: IRequestContextOutgoing = {
        type: 'plain',
        status: 200,

        headers: {
          'Content-Type': 'text/html;charset=utf-8',
        },
      };

      context.response.writeHead(outgoing.status, undefined, outgoing.headers);
      createReadStream(path.join(statics.public.dir, '/index.html')).pipe(context.response);

      return context.assign({ outgoing });
    }

    const stats = await fs.stat(path.join(statics.public.dir, parsed.dir, parsed.base)).catch(() => null);

    if (!stats) {
      const outgoing: IRequestContextOutgoing = { type: 'plain', status: 404, headers: {} };

      context.response.writeHead(outgoing.status).end();
      return context.assign({ outgoing });
    }

    createReadStream(path.join(statics.public.dir, parsed.dir, parsed.base)).pipe(context.response);
    return context.assign({ outgoing: { type: 'plain', status: 200, headers: {} } });
  })
  .compile();
