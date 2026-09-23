import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        search: resolve(import.meta.dirname, 'search.html'),
        wishlist: resolve(import.meta.dirname, 'wishlist.html'),
        levels: resolve(import.meta.dirname, 'levels.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});