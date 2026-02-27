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

const defaultState = (): AppStateV1 => ({
  schemaVersion: 1,
  lastResetAt: nowMs(),
  lastBathDay: '',
  currentCleanStreak: 0,
  bestCleanStreak: 0,
})

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

  // 旧キー吸い上げ
  const lastResetAt = Number(safeGet('lastResetAt') ?? `${nowMs()}`)
  const lastBathDay = safeGet('lastBathDay') ?? ''
  const currentCleanStreak = Number(safeGet('currentCleanStreak') ?? '0')
  const bestCleanStreak = Number(safeGet('bestCleanStreak') ?? '0')

  const next: AppStateV1 = {
    schemaVersion: 1,
    lastResetAt: Number.isFinite(lastResetAt) ? lastResetAt : nowMs(),
    lastBathDay,
    currentCleanStreak: Number.isFinite(currentCleanStreak)
      ? currentCleanStreak
      : 0,
    bestCleanStreak: Number.isFinite(bestCleanStreak) ? bestCleanStreak : 0,
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