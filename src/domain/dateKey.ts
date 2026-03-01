// src/domain/dateKey.ts

// JSTの「日付キー」(例: 2026/2/27)
// 既存データ互換のためフォーマットは "YYYY/M/D"
export const getTodayKeyJST = (): string => {
  return new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
  })
}

// "YYYY/M/D" / "YYYY/MM/DD" / "YYYY-MM-DD" などを安全にパース
export const parseDayKey = (
  key: string,
): { y: number; m: number; d: number } | null => {
  if (!key) return null

  const parts = key
    .split(/[^\d]+/)
    .filter(Boolean)
    .map(Number)

  if (parts.length < 3) return null

  const [y, m, d] = parts
  if (!y || !m || !d) return null

  return { y, m, d }
}

// JST日付キー同士の「日数差」を計算（today - last）
export const diffDaysByDayKey = (
  todayKey: string,
  lastKey: string,
): number | null => {
  const a = parseDayKey(todayKey)
  const b = parseDayKey(lastKey)
  if (!a || !b) return null

  // JSTの「日付」同士なので、UTCの同日0時にマップして差分を取る
  const dayA = Math.floor(Date.UTC(a.y, a.m - 1, a.d) / 86400000)
  const dayB = Math.floor(Date.UTC(b.y, b.m - 1, b.d) / 86400000)

  return dayA - dayB
}

// 日付キー(JST) → 連番(UTC日)
// 履歴生成を端末TZから独立させるための基盤関数
export const dayIndexFromDayKey = (key: string): number | null => {
  const p = parseDayKey(key)
  if (!p) return null
  return Math.floor(Date.UTC(p.y, p.m - 1, p.d) / 86400000)
}

// 連番(UTC日) → 日付キー(JST互換 "YYYY/M/D")
export const dayKeyFromDayIndex = (idx: number): string => {
  const d = new Date(idx * 86400000) // UTC基準
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  return `${y}/${m}/${day}`
}

// 表示用ラベル生成（"M/D"）
export const labelFromDayKey = (key: string): string => {
  const p = parseDayKey(key)
  if (!p) return key
  return `${p.m}/${p.d}`
}