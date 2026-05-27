import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { defineConfig } from 'tsup';

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
  esbuildPlugins: [NodeModulesPolyfillPlugin()],
  esbuildOptions(options) {
    options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  },
  define: {
    global: 'globalThis',
  },
});
