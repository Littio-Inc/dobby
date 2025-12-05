// @ts-check
import { config } from 'dotenv';
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';

// Load environment variables from .env file
config();

// Parse and validate polling interval once (clamp to positive integer with 2000ms fallback)
const parsePollingInterval = () => {
  const raw = process.env.DEV_POLLING_INTERVAL || '2000';
  const parsed = Number.parseInt(raw, 10);
  // Clamp to positive integer, minimum 100ms, default 2000ms
  return Number.isNaN(parsed) || parsed < 100 ? 2000 : parsed;
};

// Polling config for hot reload - only in development
const isDevelopment = process.env.NODE_ENV === 'development';
const pollingInterval = parsePollingInterval();

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
    host: true,
    port: 4321,
  },
  vite: {
    server: {
      watch: watchConfig,
    },
  },
});
