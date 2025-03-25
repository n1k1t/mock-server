import type { Configuration } from 'webpack';

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import path from 'path';
import fs from 'fs/promises';

import { cast } from './src/utils';

class LiveReloadWebpackPlugin extends LiveReloadPlugin {
  apply(compiler: any) {
    return super.apply(compiler);
  }
}

export default cast<Configuration[]>([
  {
    name: 'app',

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
  {
    name: 'styles',

    entry: path.join(__dirname, 'src', 'gui', 'styles', 'main.scss'),
    output: {
      path: path.join(__dirname, 'public', 'styles'),
    },

    module: {
      rules: [{
        test: /\.(sa|sc|c)ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              additionalData: async (content: string, additional: { context: string }) => {
                const lines = content.toString().split('\n');
                const imports = lines
                  .map((line, index) => <const>[line, index])
                  .filter(([line]) => line.includes('@import') && line.includes('*'))
                  .map(([line, index]) => <const>[line.trim().replace(/\@import\s'|';/g, ''), index]);

                for (const [minimatch, index] of imports.reverse()) {
                  lines.splice(index, 1);

                  for await (const target of fs.glob(path.resolve(additional.context, minimatch))) {
                    lines.push(`@import '${target}';`);
                  }
                }

                return lines.join('\n');
              },
            },
          },
        ],
      }],
    },

    plugins: [
      {
        apply(compiler) {
          compiler.hooks.shouldEmit.tap('Remove styles from output', (compilation) =>
            compilation
              .getAssets()
              .filter((asset) => asset.name.includes('.js'))
              .forEach((asset) => compilation.deleteAsset(asset.name))
          )
        },
      },
      new MiniCssExtractPlugin({ filename: "[name].css", }),
      new LiveReloadWebpackPlugin(),
    ],
  },
]);
