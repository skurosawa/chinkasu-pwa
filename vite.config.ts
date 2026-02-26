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

      // public/ 配下の静的アセット
      // ✅ apple-touch-icon は「public/icons/apple-touch-icon.png」ならこのパス
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png',
      ],

      manifest: {
        name: 'ふろキャン♡',
        short_name: 'ふろキャン',
        description: 'ふろキャン♡｜ゆめかわ清潔で時間と戦う、ちょっと煽り系ジョークPWA🫧',

        theme_color: '#FF69B4',
        background_color: '#FFF1FA',

        display: 'standalone',
        orientation: 'portrait',

        // GitHub Pages 配下で正しく起動するための設定
        start_url: `/${repoName}/`,
        scope: `/${repoName}/`,

        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // SPA/PWAナビゲーション安定化（GitHub Pages配下）
        navigateFallback: `/${repoName}/index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],

        // 変なURLが navigateFallback されるのを避ける（画像/アセット系）
        navigateFallbackDenylist: [
          // /assets/ や /icons/ をHTMLとして返さない
          new RegExp(`^/${repoName}/(assets|icons)/`),
          // 末尾が拡張子のリクエストはHTMLにしない
          new RegExp(`^/${repoName}/.*\\.(?:js|css|png|jpg|jpeg|svg|webp|woff2|ico)$`),
        ],

        // PWA安定化オプション
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,

        // ✅ runtimeCaching を明示（iOSでの体感安定度UP）
        runtimeCaching: [
          // HTML（ナビゲーション）は NetworkFirst：更新が反映されやすい
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3, // 体感待ちすぎ防止（回線弱い時にキャッシュへ）
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7日
              },
            },
          },

          // 画像は CacheFirst：オフライン/起動が強くなる
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
            },
          },

          // フォントは CacheFirst：ちらつき・再DLを防ぐ
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
              },
            },
          },
        ],
      },
    }),
  ],
})
