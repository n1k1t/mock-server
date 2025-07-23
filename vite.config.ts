import commonjs from 'vite-plugin-commonjs';
import path from 'path';
import fs from 'fs/promises';

import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig } from 'vite';

import { IDevContext } from './src/gui/app/types';
import { cast } from './src/utils';

export default defineConfig(({ mode }) => ({
  root: path.join(__dirname, 'src', 'gui'),
  base: '',

  server: {
    host: 'localhost',
    port: 13001,
    open: true,
  },

  define: {
    ...(mode === 'development' && {
      DEV: JSON.stringify(cast<IDevContext>({
        io: {
          origin: 'http://localhost:13000',
          path: '/socket.io/',
        },
      })),
    }),
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: async (source, filename) => {
          const dir = path.dirname(filename);
          const lines = source.toString().split('\n');

          const imports = lines
            .map((line, index) => <const>[line, index])
            .filter(([line]) => line.includes('@import') && line.includes('*'))
            .map(([line, index]) => <const>[line.trim().replace(/\@import\s'|';/g, ''), index]);

          for (const [minimatch, index] of imports.reverse()) {
            lines.splice(index, 1);

            for await (const target of fs.glob(path.resolve(dir, minimatch))) {
              lines.push(`@import '${target}';`);
            }
          }

          return lines.join('\n');
        },
      },
    },
  },

  build: {
    emptyOutDir: true,
    outDir: path.join(__dirname, 'public'),
  },

  plugins: [nodePolyfills(), commonjs()],
}));
