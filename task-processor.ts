import { registerBackgroundTasks, useLivereloadServer } from '@n1k1t/task-processor';
import { CompilerOptions } from 'typescript';
import babelify from 'babelify';
import tsify from 'tsify';

import guiTSConfig from './src/gui/app/tsconfig.json';

interface ITsifyConfig {
  project: {
    compilerOptions: Omit<CompilerOptions, 'module'> & { module: string };
    exclude?: string[];
    include?: string[];
  }
};

const PUBLIC_DIR = 'public';

useLivereloadServer();

registerBackgroundTasks([
  {
    name: 'Compile ts',
    watch: {
      match: 'src/gui/app/**/*.ts',
      triggerOnly: true,
    },
    use: [
      {
        processor: 'get-files',
        path: 'src/gui/app/main.ts',
      },
      {
        processor: 'commonjs-bundle',
        target: 'ESNext',

        plugins: [[tsify, {
          project: {
            compilerOptions: guiTSConfig.compilerOptions,
            include: ['types/common.global.ts'],
          },
        } satisfies ITsifyConfig]],
        transform: [
          [babelify, {
            plugins: [
              ['@babel/plugin-transform-typescript', { onlyRemoveTypeImports: true }],
            ],
            presets: [
              ['@babel/preset-env', { modules: 'commonjs' } ],
            ],
          }],
        ],
      },
      {
        processor: 'write-files',
        dir: `${PUBLIC_DIR}/scripts`,
        ext: '.js',
      },
      {
        processor: 'livereload',
        action: 'reload',
      },
    ],
  },
  {
    name: 'Compile scss',
    watch: { match: 'src/gui/styles/*.scss', ignore: '**/_*' },
    use: [
      {
        processor: 'sass-bundle',
      },
      {
        processor: 'write-files',
        dir: `${PUBLIC_DIR}/styles`,
        ext: '.css',
      },
      {
        processor: 'livereload',
        action: 'inject',
      },
    ],
  },
]);
