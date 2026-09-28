import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'EduKid — كلام ناعم',
        short_name: 'EduKid',
        description: 'برنامج في البيت لدعم الأطفال اللي عندهم تلعثم، مع ألعاب للحروف والأرقام',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#FBF7EF',
        theme_color: '#FBF7EF',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:4410' } },
  preview: { port: 4173, proxy: { '/api': 'http://127.0.0.1:4410' } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test-setup.ts'], testTimeout: 20_000 },
});
