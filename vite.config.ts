import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoName = 'chinkasu-pwa'

export default defineConfig({
  base: `/${repoName}/`,

  resolve: {
    // React重複事故防止（iOS白画面対策）
    dedupe: ['react', 'react-dom'],
  },

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'apple-touch-icon.png',
      ],

      manifest: {
        name: 'ちんかすカウンター',
        short_name: 'ちんかす',
        description: 'ゆめかわ清潔で毎日きろくするジョークPWA🫧',

        theme_color: '#FF69B4',
        background_color: '#FFF1FA',

        display: 'standalone',
        orientation: 'portrait', // ← 画面回転禁止

        start_url: `/${repoName}/`,
        scope: `/${repoName}/`,

        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        navigateFallback: `/${repoName}/index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],

        // PWA安定化オプション
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
