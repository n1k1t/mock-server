import LiveReloadPlugin from 'webpack-livereload-plugin';
import path from 'path';

import { Configuration } from 'webpack';

import { TFunction } from './src/types';
import { cast } from './src/utils';

class LiveReloadWebpackPlugin extends LiveReloadPlugin {
  apply(compiler: any) {
    return super.apply(compiler);
  }
}

export default cast<TFunction<Configuration[], [object, Pick<Configuration, 'mode'>]>>((env, options) => {
  if (options.mode === 'development') {
    require('./test');
  }

  return [
    {
      name: 'app',
      target: 'web',

      entry: path.join(__dirname, 'src', 'gui', 'app', 'main.ts'),
      output: {
        filename: 'main.js',
        path: path.join(__dirname, 'public', 'scripts'),
      },

      module: {
        rules: [{
          test: /\.ts$/i,
          loader: 'ts-loader',

          options: {
            configFile: path.join(__dirname, 'src', 'gui', 'app', 'tsconfig.json'),
          },
        }],
      },

      resolve: {
        extensions: ['.js', '.ts', '.json', '.hbs'],

        fallback: {
          fs: false,
        },
      },

      plugins: [new LiveReloadWebpackPlugin()],
    },
    // {
    //   name: 'app',
    //   target: 'web',

    //   entry: path.join(__dirname, 'src', 'gui', 'styles', 'main.scss'),
    //   output: {
    //     filename: 'main.css',
    //     path: path.join(__dirname, 'public', 'styles'),
    //   },

    //   module: {
    //     rules: [{
    //       test: /\.(sa|sc|c)ss$/i,
    //       use: ['style-loader', 'css-loader', 'sass-loader'],
    //     }],
    //   },

    //   plugins: [new LiveReloadWebpackPlugin()],
    // }
  ];
});
