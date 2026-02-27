// src/lib/bathHistory.ts

export type BathEvent = {
  ts: number // Unix ms
  dayKey: string // JST dayKey: "YYYY/M/D"（既存互換）
  pointBefore: number
}

const STORAGE_KEY = 'bathEvents'
const MAX_EVENTS = 200

// ✅ localStorage 例外対策（iOSプライベート/制限などで落ちないように）
const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

const isValidEvent = (e: any): e is BathEvent => {
  return (
    e &&
    typeof e.ts === 'number' &&
    Number.isFinite(e.ts) &&
    typeof e.dayKey === 'string' &&
    e.dayKey.length > 0 &&
    typeof e.pointBefore === 'number' &&
    Number.isFinite(e.pointBefore)
  )
}

export function loadBathEvents(): BathEvent[] {
  try {
    const raw = safeGet(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return (parsed as unknown[])
      .filter(isValidEvent)
      .sort((a, b) => a.ts - b.ts)
  } catch {
    return []
  }
}

/**
 * 履歴にイベントを追加して保存する
 * - MAX_EVENTS を超えたら古いものから捨てる
 * - ルールA（1日1回）をストレージ側でも防御：同じdayKeyが既にあれば「置き換え」
 *   （App側で同日追加しない実装でも、将来の改修で壊れにくくする保険）
 */
export function appendBathEvent(event: BathEvent): BathEvent[] {
  const events = loadBathEvents()

  // ✅ 同日キーがあれば置き換え（最後の記録を正にする）
  const idx = events.findIndex((e) => e.dayKey === event.dayKey)
  if (idx >= 0) {
    events[idx] = event
  } else {
    events.push(event)
  }

  // 念のため時刻順で正規化
  events.sort((a, b) => a.ts - b.ts)

  const trimmed = events.slice(-MAX_EVENTS)
  safeSet(STORAGE_KEY, JSON.stringify(trimmed))
  return trimmed
}