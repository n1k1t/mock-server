import path from 'path';

import type { TLoggerLevel } from '../logger';

import { Config } from './model';
import { cast } from '../utils';

export * from './model';

const databaseSystemKeyPrefix = 'system:56cfe066-dffe-4b68-b8b7-18f9e8890bfe';

export default Config.build(<const>{
  database: {
    systemKeyPrefix: databaseSystemKeyPrefix,
  },

  statics: {
    public: {
      dir: path.resolve(
        path.resolve(__dirname, path.parse(__filename).ext === '.ts' ? '' : '../', '../../'),
        'public'
      ),
    },
  },

  routes: {
    internal: {
      root: '/_system',
      gui: '/gui',
    },
  },

  history: {
    limit: cast<number>(100),

    persistence: {
      isEnabled: cast<boolean>(false),
      key: cast<string>(`${databaseSystemKeyPrefix}:history`),
    },
  },

  logger: {
    level: cast<TLoggerLevel>('D'),
  },
});
