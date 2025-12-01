// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), tailwind()],
  server: {
    host: true, // Listen on all network interfaces
    port: 4321,
  },
  vite: {
    server: {
      proxy: {
        '/api/diagon': {
          target: process.env.PUBLIC_DIAGON_API_URL || 'https://a3a9mlmbsk.execute-api.us-east-1.amazonaws.com/staging',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/diagon/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
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
