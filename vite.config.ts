// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoName = 'chinkasu-pwa' // ←ここを自分のリポジトリ名に

export default defineConfig({
  base: `/${repoName}/`,
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

        // Pagesのサブパスに合わせる
        start_url: `/${repoName}/`,
        scope: `/${repoName}/`,

        // 先頭スラッシュ無し（相対パス）にするのがPagesで安全
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
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})
