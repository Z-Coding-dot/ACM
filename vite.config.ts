import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const backend = loadEnv(mode, process.cwd(), 'VITE_').VITE_BACKEND_URL || 'http://127.0.0.1:8000';
  return {
  server: { port: 5173, strictPort: true, proxy: { '/api': backend, '/sanctum': backend }, watch: { ignored: ['**/backend/**', '**/docs/**', '**/e2e/**', '**/README.md', '**/playwright-report/**', '**/test-results/**', '**/.npm-cache/**'] } },
  preview: { proxy: { '/api': backend, '/sanctum': backend } },
  build: { target: 'es2022' },
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt', injectRegister: null,
    includeAssets: ['brand/acm-mark.webp', 'brand/google-g.png', 'icons/*.png'],
    manifest: {
      name: 'Appointment & Customer Management', short_name: 'ACM',
      description: 'Scheduling and customer management for service businesses',
      start_url: '/', scope: '/', display: 'standalone',
      background_color: '#f7f8f6', theme_color: '#215a4a',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2}'],
      globIgnores: ['brand/ACM_LOGO.png', 'brand/acm-logo-transparent.png'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//, /^\/auth\/google\//, /^\/email\/verify\//, /^\/up$/, /^\/health/],
      runtimeCaching: [], cleanupOutdatedCaches: true,
    },
  })],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'], clearMocks: true },
}; });
