/// <reference types="vitest" />

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const { DIR, PORT = '8080' } = process.env;

export default defineConfig(({ mode }) => {
  if (mode === 'test') {
    return {
      test: {
        environment: 'happy-dom',
        setupFiles: ['./tests/vitest-setup.ts'],
      },
      plugins: [tsconfigPaths()],
    };
  }
  if (!DIR) {
    throw new Error('DIR environment variable is required');
  }
  return {
    root: resolve('examples', DIR),
    server: { port: Number(PORT) },
    plugins: [tsconfigPaths({ root: resolve('.') })],
  };
});
