import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: [
    'events',
    'uuid',
    'fs',
    'path',
    'crypto'
  ],
  noExternal: [],
  treeshake: true,
  minify: false,
  target: 'node16',
  banner: {
    js: '/* Fraud Detection Module - LinkPick Platform */'
  }
});