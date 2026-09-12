import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/familia/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Casadacosta',
        short_name: 'Casadacosta',
        description: 'Tarefas da casa, notas e arquivos da família Costa.',
        lang: 'pt-PT',
        start_url: '/familia/',
        scope: '/familia/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#FFFFFF',
        icons: [
          { src: '/familia/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/familia/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/familia/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/familia/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
