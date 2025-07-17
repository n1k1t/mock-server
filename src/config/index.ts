import path from 'path';

import type { TLoggerLevel } from '../logger';

import { Config } from './model';
import { cast } from '../utils';

export * from './model';

const systemDatabaseKeyPrefix = 'system:b3afded0-c54d-4841-a933-ae0579b22547';

export default Config.build(<const>{
  database: {
    systemKeyPrefix: systemDatabaseKeyPrefix,
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

    persistenation: {
      isEnabled: cast<boolean>(false),
      key: cast<string>(`${systemDatabaseKeyPrefix}:history`),
    },
  },

  logger: {
    level: cast<TLoggerLevel>('D'),
  },
});
