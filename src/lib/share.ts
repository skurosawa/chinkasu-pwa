// src/lib/share.ts

type SharePayload = { text: string; url?: string }

export async function copyText(text: string): Promise<boolean> {
  // 1) Clipboard API（使えるなら最優先）
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fallthrough
  }

  // 2) フォールバック（execCommand）
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    // iOS Safariで画面がガタつかないよう固定配置
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.opacity = '0'
    ta.style.pointerEvents = 'none'

    document.body.appendChild(ta)

    // iOS向け：select() が効かないケースがあるので range を明示
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, ta.value.length)

    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/**
 * ネイティブ共有（Web Share API）
 * - 対応していない環境では false
 * - canShare が使える環境では payload 可否を事前チェック
 */
export async function tryNativeShare(payload: SharePayload): Promise<boolean> {
  try {
    if (!('share' in navigator)) return false

    const navAny = navigator as any

    // canShare がある場合は事前に確認（失敗→例外を減らす）
    if (typeof navAny.canShare === 'function') {
      const can = navAny.canShare(payload)
      if (!can) return false
    }

    await navAny.share(payload)
    return true
  } catch {
    return false
  }
}