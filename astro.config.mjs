// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';

// Polling config for hot reload - only in development
const isDevelopment = process.env.NODE_ENV === 'development';
const pollingInterval = 2000; // Fixed polling interval: 2000ms

// Only enable watch/polling in development mode
const watchConfig = isDevelopment
  ? {
      // Enable polling for better file watching in Docker/Windows
      // Only active when NODE_ENV=development
      usePolling: true,
      interval: pollingInterval,
    }
  : undefined;

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), tailwind()],
  // Server config only used in development (npm run dev)
  server: {
    host: true, // Listen on all network interfaces
    port: 4321,
  },
  // Vite config - watch only used in development
  vite: {
    server: {
      watch: watchConfig,
    },
  },
});
