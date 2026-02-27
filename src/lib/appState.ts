// src/lib/appState.ts

export type AppStateV1 = {
  schemaVersion: 1
  lastResetAt: number
  lastBathDay: string
  currentCleanStreak: number
  bestCleanStreak: number
}

const STATE_KEY = 'furo_rhythm_state_v1'

// ✅ localStorage 例外対策
const safeGet = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

const nowMs = () => Date.now()

const isValidStateV1 = (s: any): s is AppStateV1 => {
  return (
    s &&
    s.schemaVersion === 1 &&
    typeof s.lastResetAt === 'number' &&
    Number.isFinite(s.lastResetAt) &&
    typeof s.lastBathDay === 'string' &&
    typeof s.currentCleanStreak === 'number' &&
    Number.isFinite(s.currentCleanStreak) &&
    typeof s.bestCleanStreak === 'number' &&
    Number.isFinite(s.bestCleanStreak)
  )
}

/**
 * 旧キーからV1へ移行（既存互換）
 * - lastResetAt / lastBathDay / currentCleanStreak / bestCleanStreak を吸い上げる
 * - 旧キーが無くても “妥当な初期値” を生成する
 */
export function migrateStateIfNeeded(): AppStateV1 {
  // すでに新stateがあればそれが正
  const raw = safeGet(STATE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (isValidStateV1(parsed)) return parsed
    } catch {
      // fallthrough
    }
  }

  // 旧キー吸い上げ（無ければ初期値へ）
  const lastResetAtRaw = safeGet('lastResetAt')
  const lastResetAtNum = lastResetAtRaw ? Number(lastResetAtRaw) : NaN
  const lastResetAt = Number.isFinite(lastResetAtNum) ? lastResetAtNum : nowMs()

  const lastBathDay = safeGet('lastBathDay') ?? ''

  const currentCleanRaw = safeGet('currentCleanStreak')
  const currentCleanNum = currentCleanRaw ? Number(currentCleanRaw) : NaN
  const currentCleanStreak = Number.isFinite(currentCleanNum)
    ? currentCleanNum
    : 0

  const bestCleanRaw = safeGet('bestCleanStreak')
  const bestCleanNum = bestCleanRaw ? Number(bestCleanRaw) : NaN
  const bestCleanStreak = Number.isFinite(bestCleanNum) ? bestCleanNum : 0

  const next: AppStateV1 = {
    schemaVersion: 1,
    lastResetAt,
    lastBathDay,
    currentCleanStreak,
    bestCleanStreak,
  }

  saveState(next)
  return next
}

export function loadState(): AppStateV1 {
  const raw = safeGet(STATE_KEY)
  if (!raw) return migrateStateIfNeeded()

  try {
    const parsed = JSON.parse(raw)
    if (isValidStateV1(parsed)) return parsed
  } catch {
    // fallthrough
  }

  // 壊れてたら migrate で復旧
  return migrateStateIfNeeded()
}

export function saveState(state: AppStateV1): boolean {
  return safeSet(STATE_KEY, JSON.stringify(state))
}