// src/domain/history.ts

import {
  dayIndexFromDayKey,
  dayKeyFromDayIndex,
  labelFromDayKey,
} from './dateKey'

export type BathEvent = {
  ts: number
  dayKey: string
  pointBefore: number
}

export type HistoryItem = {
  key: string
  label: string
  count: number
  height: number
}

export type HistoryResult = {
  items: HistoryItem[]
}

/**
 * 履歴表示データを生成
 *
 * 仕様:
 * - JST日付ベース
 * - 端末TZ非依存
 * - 0回の日はドット表示用 height=0
 * - 自動スケーリング
 */
export function buildHistoryData(
  events: BathEvent[],
  todayKey: string,
  range: 7 | 30,
): HistoryResult {
  // dayKeyごとに回数集計
  const countByDayKey = new Map<string, number>()
  for (const e of events) {
    const k = e.dayKey
    countByDayKey.set(k, (countByDayKey.get(k) ?? 0) + 1)
  }

  const todayIdx = dayIndexFromDayKey(todayKey)

  const days: { key: string; label: string; count: number }[] = []

  for (let i = range - 1; i >= 0; i--) {
    const key =
      todayIdx === null ? todayKey : dayKeyFromDayIndex(todayIdx - i)

    const count = countByDayKey.get(key) ?? 0
    const label = labelFromDayKey(key)

    days.push({ key, label, count })
  }

  // スケーリング
  const max = Math.max(1, ...days.map((d) => d.count))
  const maxHeight = 72

  const items: HistoryItem[] = days.map((d) => {
    if (d.count === 0) {
      return { ...d, height: 0 }
    }

    const height = Math.max(10, Math.round((d.count / max) * maxHeight))
    return { ...d, height }
  })

  return { items }
}