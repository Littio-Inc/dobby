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

// Compute polling config once (reused for both server.watch and vite.server.watch)
const isDevelopment = process.env.NODE_ENV === 'development';
const usePolling = isDevelopment && process.env.DEV_USE_POLLING === '1';
const pollingInterval = parsePollingInterval();

const watchConfig = usePolling
  ? {
      // Enable polling for better file watching in Docker/Windows
      // Only enabled when DEV_USE_POLLING=1 environment variable is set
      // Only used in development, not in production builds
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
      proxy: {
        '/api/diagon': {
          target: (() => {
            const apiUrl = process.env.PUBLIC_DIAGON_API_URL;
            if (!apiUrl) {
              throw new Error(
                'PUBLIC_DIAGON_API_URL environment variable is required. ' +
                  'Please set it in your .env file or environment variables.'
              );
            }
            return apiUrl;
          })(),
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/diagon/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const xApiKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
              if (xApiKey) {
                proxyReq.setHeader('X-API-KEY', xApiKey);
              } else {
                console.warn('[Proxy] X-API-KEY header not found in request');
              }
            });
          },
        },
      },
    },
  },
});
