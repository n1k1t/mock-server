import fs from 'fs/promises';
import { createReadStream } from 'fs';
import _ from 'lodash';
import path from 'path';

import { clientConfig } from '../../config';
import { Middleware } from './model';

export default Middleware
  .build(__filename)
  .assignHandler(async (context, next) => {
    if (!context.path.includes(clientConfig.publicRoute)) {
      return next();
    }

    const requestPath = context.path.replace(clientConfig.publicRoute, '');
    const requestPathDetails = path.parse(requestPath);

    if (!requestPath) {
      return context.http.response
        .writeHead(301, 'Moved', { Location: path.join(clientConfig.publicRoute, '/') })
        .end();
    }

    if (requestPathDetails.dir === '/' && !requestPathDetails.ext) {
      context.http.response.writeHead(200, 'Ok', { 'Content-type': 'text/html;charset=utf-8' });

      return createReadStream(path.join(clientConfig.publicDirPath, '/index.html'))
        .pipe(context.http.response);
    }

    const fileStat = await fs.stat(path.join(clientConfig.publicDirPath, requestPath)).catch(() => null);
    if (fileStat === null) {
      return context.http.response
        .writeHead(404, 'Not found')
        .end();
    }

    return createReadStream(path.join(clientConfig.publicDirPath, requestPath))
      .pipe(context.http.response);
  });
