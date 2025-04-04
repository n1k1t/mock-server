import path from 'path';

import type { TLoggerLevel } from '../logger';

import { Config } from './model';
import { cast } from '../utils';

export * from './model';

const checkIsTypeScriptRuntime = (): boolean => path.parse(__filename).ext === '.ts';
const getPathToRoot = (): string => path.resolve(__dirname, checkIsTypeScriptRuntime() ? '' : '../', '../../');

export default Config.build(<const>{
    statics: {
      public: {
        dir: path.resolve(getPathToRoot(), 'public'),
      },
    },

    routes: {
      internal: {
        root: '/_system',
        gui: '/gui',
      },
    },

    history: {
      limit: 100,
    },

    logger: {
      level: cast<TLoggerLevel>('D'),
    },
  });
