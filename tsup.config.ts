import { readFile } from 'node:fs/promises';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import type { BuildOptions, PluginBuild } from 'esbuild';
import postcss from 'postcss';
import { defineConfig } from 'tsup';

const postcssPlugin = () => ({
  name: 'postcss',
  setup(build: PluginBuild) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      if (args.path.includes('node_modules')) return;
      const css = await readFile(args.path, 'utf8');
      const result = await postcss([tailwindcss(), autoprefixer]).process(css, { from: args.path });
      return { contents: result.css, loader: 'css' };
    });
  },
});

export default defineConfig({
  entry: {
    taskpane: 'src/taskpane/index.tsx',
    commands: 'src/commands/commands.ts',
  },
  outDir: 'dist-tsup',
  format: ['iife'],
  platform: 'browser',
  target: 'es2015',
  sourcemap: false,
  clean: true,
  minify: true,
  treeshake: true,
  tsconfig: './tsconfig.json',
  env: {
    NODE_ENV: 'production',
  },
  esbuildPlugins: [postcssPlugin(), NodeModulesPolyfillPlugin()],
  esbuildOptions(options: BuildOptions) {
    options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  },
  define: {
    global: 'globalThis',
  },
});
