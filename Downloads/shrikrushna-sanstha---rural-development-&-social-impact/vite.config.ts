import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'security-guard-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const rawUrl = req.url || '';
            const pathname = rawUrl.split('?')[0];

            // 1. Strictly block any request into backend-php-mysql that is not explicitly API or uploads
            if (pathname.startsWith('/backend-php-mysql')) {
              if (
                !pathname.startsWith('/backend-php-mysql/api') &&
                !pathname.startsWith('/backend-php-mysql/uploads')
              ) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('403 Forbidden: Access to internal backend assets is restricted.');
                return;
              }
            }

            // 2. Strictly block access to sensitive file extensions anywhere in the server tree
            if (
              /\.(sql|env|bak|log|ini|sh|bat)$/i.test(pathname) ||
              pathname.includes('.client_admin_handoff') ||
              (pathname.endsWith('.php') && !pathname.startsWith('/backend-php-mysql/api'))
            ) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end('403 Forbidden: Access to sensitive file is prohibited.');
              return;
            }

            next();
          });
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
              return 'vendor-three';
            }
            if (id.includes('node_modules/gsap')) {
              return 'vendor-gsap';
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      fs: {
        deny: [
          '**/.env*',
          '**/*.sql',
          '**/*.php',
          '**/.client_admin_handoff.txt',
          '**/backend-php-mysql/config/**',
          '**/backend-php-mysql/bin/**',
          '**/backend-php-mysql/migrations/**',
          '**/backend-php-mysql/reports/**',
        ],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Restrict external host access to explicit TUNNEL_HOST env or standard secure tunnel domains
      allowedHosts: process.env.TUNNEL_HOST
        ? [process.env.TUNNEL_HOST]
        : ['localhost', '127.0.0.1', '.trycloudflare.com', '.loca.lt', '.ngrok-free.app'],
      // Local dev proxy strictly routing necessary public API endpoints and uploads to PHP server.
      // Internal directories (.env, migrations, config, bin, dotfiles) are strictly blocked from proxying.
      proxy: {
        '/backend-php-mysql/api': {
          target: process.env.PHP_BACKEND_URL || 'http://127.0.0.1:8088',
          changeOrigin: true,
        },
        '/backend-php-mysql/uploads': {
          target: process.env.PHP_BACKEND_URL || 'http://127.0.0.1:8088',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
      proxy: {
        '/backend-php-mysql/api': {
          target: process.env.PHP_BACKEND_URL || 'http://127.0.0.1:8088',
          changeOrigin: true,
        },
        '/backend-php-mysql/uploads': {
          target: process.env.PHP_BACKEND_URL || 'http://127.0.0.1:8088',
          changeOrigin: true,
        },
      },
    },
  };
});
