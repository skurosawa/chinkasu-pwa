// src/domain/bath.ts

import { diffDaysByDayKey } from './dateKey'

export type BathInput = {
  nowMs: number
  todayKey: string
  lastBathDay: string | null
  currentStreak: number
  bestStreak: number
  pointBefore: number
}

export type BathResult = {
  nextStreak: number
  nextBest: number
  shouldRecordHistory: boolean
  isSameDay: boolean
}

export function computeBathResult(input: BathInput): BathResult {
  const {
    todayKey,
    lastBathDay,
    currentStreak,
    bestStreak,
    pointBefore,
  } = input

  // ✅ 同日判定（最優先）
  const isSameDay = lastBathDay === todayKey

  if (isSameDay) {
    return {
      nextStreak: currentStreak,
      nextBest: bestStreak,
      shouldRecordHistory: false,
      isSameDay: true,
    }
  }

  // ✅ 履歴に積む条件
  // 「0時間で押されたリセット」は記録しない
  const shouldRecordHistory = pointBefore >= 1

  // ✅ 連続日数ロジック
  let nextStreak = 1

  if (lastBathDay) {
    const diff = diffDaysByDayKey(todayKey, lastBathDay)

    if (diff === 1) {
      nextStreak = currentStreak + 1
    } else {
      nextStreak = 1
    }
  }

  const nextBest = Math.max(bestStreak, nextStreak)

  return {
    nextStreak,
    nextBest,
    shouldRecordHistory,
    isSameDay: false,
  }
}