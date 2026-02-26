import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ✅ PWA更新検知（VitePWAの推奨）
// injectRegister:'auto' でも、これでイベントフックできる
import { registerSW } from 'virtual:pwa-register'

registerSW({
  // 新しいSWが入った（＝更新が見つかった）
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa:update-available'))
  },
  // 初回キャッシュ完了（オフラインOKになった）
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('pwa:offline-ready'))
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
