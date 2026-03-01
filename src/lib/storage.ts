export type AppState = {
  lastResetAt: number
  lastBathDay: string | null
  currentCleanStreak: number
  bestCleanStreak: number
}

const KEY = 'furorhythm_state_v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return {
        lastResetAt: Date.now(),
        lastBathDay: null,
        currentCleanStreak: 0,
        bestCleanStreak: 0,
      }
    }
    return JSON.parse(raw)
  } catch {
    return {
      lastResetAt: Date.now(),
      lastBathDay: null,
      currentCleanStreak: 0,
      bestCleanStreak: 0,
    }
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}