import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoName = 'chinkasu-pwa' // GitHub Pages の repo 名（base/start_url/scope に使う）

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

      // NOTE: apple-touch-icon.png を public/ に置いてないなら 404 になるので外してOK
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'apple-touch-icon.png',
      ],

      manifest: {
        // ✅ アプリ名変更（ホーム画面/インストール名に反映）
        name: 'ふろキャン♡',
        short_name: 'ふろキャン',

        // ✅ 世界観も寄せる
        description: 'ふろキャン♡｜ゆめかわ清潔で毎日きろくするジョークPWA🫧',

        // ピンク基調はそのまま
        theme_color: '#FF69B4',
        background_color: '#FFF1FA',

        display: 'standalone',
        orientation: 'portrait', // 画面回転禁止

        // GitHub Pages 配下で正しく起動するための設定
        start_url: `/${repoName}/`,
        scope: `/${repoName}/`,

        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          // ✅ maskable は purpose を "maskable" 単独に（解釈が安定）
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // GitHub Pages 配下でのSPA/PWAナビゲーション安定化
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
