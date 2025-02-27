import { registerBackgroundTasks, registerCliTasks, useLivereloadServer } from '@n1k1t/task-processor';
import { CompilerOptions } from 'typescript';
import { ITask } from '@n1k1t/task-processor/lib/src/typings';
import babelify from 'babelify';
import tsify from 'tsify';
import path from 'path';
import fs from 'fs/promises';

import project from './src/gui/app/tsconfig.json';

interface ITsifyConfig {
  project: {
    compilerOptions: Omit<CompilerOptions, 'module'> & { module: string };
    exclude?: string[];
    include?: string[];
  }
};

const PUBLIC_DIR = 'public';

const compileTsProcessorSteps = (options?: { minify?: boolean }): ITask['use'] => [
  { processor: 'get-files', path: 'src/gui/app/main.ts' },
  {
    processor: 'commonjs-bundle',
    target: 'ESNext',

    plugins: [[tsify, {
      project: {
        compilerOptions: project.compilerOptions,
        include: ['types/common.global.ts'],
      },
    } satisfies ITsifyConfig]],
    transform: [
      [babelify, {
        minified: options?.minify,
        comments: false,

        plugins: [['@babel/plugin-transform-typescript', { onlyRemoveTypeImports: true }]],
        presets: [['@babel/preset-env', { modules: 'commonjs' } ]],
      }],
    ],
  },
  { processor: 'write-files', dir: `${PUBLIC_DIR}/scripts`, ext: '.js' },
  { processor: 'livereload', action: 'reload' },
];

const compileScssProcessorSteps = (): ITask['use'] => [
  { processor: 'get-files', path: 'src/gui/styles/main.scss' },
  {
    processor: 'middleware',
    fn: async (context) => {
      await Promise.all([...context.files].map(async (file) => {
        const lines = file.dist.content.toString().split('\n');
        const imports = lines
          .map((line, index) => <const>[line, index])
          .filter(([line]) => line.includes('@import') && line.includes('*'))
          .map(([line, index]) => <const>[line.trim().replace(/\@import\s'|';/g, ''), index]);

        for (const [minimatch, index] of imports.reverse()) {
          lines.splice(index, 1);

          for await (const target of fs.glob(path.resolve(file.dir, minimatch))) {
            lines.push(`@import '${target}';`);
          }
        }

        file.setContent(lines.join('\n'));
      }));
    },
  },
  { processor: 'sass-bundle' },
  { processor: 'write-files', dir: `${PUBLIC_DIR}/styles`, ext: '.css' },
  { processor: 'livereload', action: 'inject' },
];

useLivereloadServer();

registerCliTasks([{
  name: 'compile',
  description: 'Compiles TS (minified) and SCSS',
  use: [
    ...compileTsProcessorSteps({ minify: true }),
    {
      processor: 'middleware',
      fn: (context) => context.files.clear()
    },
    ...compileScssProcessorSteps(),
  ],
}]);

registerBackgroundTasks([
  {
    name: 'Compile TS',
    watch: { match: 'src/gui/app/**/*.{ts,hbs}', triggerOnly: true },
    use: compileTsProcessorSteps(),
  },
  {
    name: 'Compile SCSS',
    watch: { match: 'src/gui/**/*.scss', triggerOnly: true },
    use: compileScssProcessorSteps(),
  },
]);
