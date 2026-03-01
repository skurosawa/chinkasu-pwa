type BathInput = {
  nowMs: number
  todayKey: string
  lastBathDay: string | null
  currentStreak: number
  bestStreak: number
  pointBefore: number
}

type BathResult = {
  nextStreak: number
  nextBest: number
  shouldRecordHistory: boolean
}

export function computeBathResult(input: BathInput): BathResult {
  const {
    todayKey,
    lastBathDay,
    currentStreak,
    bestStreak,
    pointBefore,
  } = input

  if (lastBathDay === todayKey) {
    return {
      nextStreak: currentStreak,
      nextBest: bestStreak,
      shouldRecordHistory: false,
    }
  }

  const nextStreak = currentStreak + 1
  const nextBest = Math.max(bestStreak, nextStreak)

  return {
    nextStreak,
    nextBest,
    shouldRecordHistory: pointBefore >= 1,
  }
}