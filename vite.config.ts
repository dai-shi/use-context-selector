/// <reference types="vitest" />

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

const { DIR, PORT = '8080' } = process.env;

export default defineConfig(({ mode }) => {
  if (mode === 'test') {
    return {
      resolve: { alias: { 'use-context-selector': resolve('src') } },
      test: {
        environment: 'happy-dom',
        setupFiles: ['./tests/vitest-setup.js'],
      },
    };
  }
  if (!DIR) {
    throw new Error('DIR environment variable is required');
  }
  return {
    root: resolve('examples', DIR),
    server: { port: Number(PORT) },
    resolve: { alias: { 'use-context-selector': resolve('src') } },
    plugins: [indexHtml(resolve('examples', DIR, 'public', 'index.html'))],
  };
});

function indexHtml(file: string): Plugin {
  const html = readFileSync(file, 'utf8');
  return {
    name: 'index-html-plugin',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res) => {
          server
            .transformIndexHtml(req.url || '', html)
            .then((content) => {
              res.statusCode = 200;
              res.setHeader('content-type', 'text/html; charset=utf-8');
              res.end(content);
            })
            .catch((err) => {
              console.error('Error transforming index.html', err);
              res.statusCode = 500;
              res.end('Internal Server Error');
            });
        });
      };
    },
    config() {
      return { optimizeDeps: { entries: ['src/index'] } };
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module', src: '/src/index' },
        },
      ];
    },
  };
}
