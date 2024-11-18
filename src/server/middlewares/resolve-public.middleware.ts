import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import _ from 'lodash';

import { Middleware } from '../models';

export default Middleware
  .build(__filename)
  .assignHandler(async (context, next) => {
    if (!context.incoming.path.includes(context.server.config.client.publicRoute)) {
      return next();
    }

    const requestPath = context.incoming.path.replace(context.server.config.client.publicRoute, '');
    const requestPathDetails = path.parse(requestPath);

    if (!requestPath) {
      return context.response
        .writeHead(301, 'Moved', { Location: path.join(context.server.config.client.publicRoute, '/') })
        .end();
    }

    if (requestPathDetails.dir === '/' && !requestPathDetails.ext) {
      context.response.writeHead(200, 'Ok', { 'Content-type': 'text/html;charset=utf-8' });

      return createReadStream(path.join(context.server.config.client.publicDirPath, '/index.html'))
        .pipe(context.response);
    }

    const fileStat = await fs.stat(path.join(context.server.config.client.publicDirPath, requestPath)).catch(() => null);
    if (fileStat === null) {
      return context.response
        .writeHead(404, 'Not found')
        .end();
    }

    return createReadStream(path.join(context.server.config.client.publicDirPath, requestPath))
      .pipe(context.response);
  });
