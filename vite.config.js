import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [viteSingleFile(), cloudflare()],
  build: {
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
});