import { createReadStream } from 'fs';
import path from 'path';
import fs from 'fs/promises';
import _ from 'lodash';

import { Middleware } from '../models';
import config from '../../config';

export default Middleware
  .build(__filename)
  .assignHandler(async (context) => {
    const gui = config.get('gui');
    const statics = config.get('statics');

    if (!context.incoming.path.includes(gui.route)) {
      return null;
    }

    const requestPath = context.incoming.path.replace(gui.route, '');
    const requestPathDetails = path.parse(requestPath);

    if (!requestPath) {
      context.response.writeHead(301, 'Moved', { Location: path.join(gui.route, '/') }).end();
      return context.complete();
    }

    if (requestPathDetails.dir === '/' && !requestPathDetails.ext) {
      context.response.writeHead(200, 'Ok', { 'Content-type': 'text/html;charset=utf-8' });

      createReadStream(path.join(statics.public.dir, '/index.html')).pipe(context.response);
      return context.complete();
    }

    const fileStat = await fs.stat(path.join(statics.public.dir, requestPath)).catch(() => null);
    if (fileStat === null) {
      context.response.writeHead(404, 'Not found').end();
      return context.complete();
    }

    createReadStream(path.join(statics.public.dir, requestPath)).pipe(context.response);
    context.complete();
  });
