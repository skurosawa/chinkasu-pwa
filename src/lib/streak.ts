// src/lib/streak.ts
const getJstDate = (d: Date) =>
  d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })

const parseJst = (s: string) => {
  // 'YYYY/MM/DD' を Date にする（JST基準で扱いたいので正午固定）
  const [y, m, day] = s.split('/').map(Number)
  return new Date(y, m - 1, day, 12, 0, 0)
}

const addDays = (d: Date, n: number) => {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

export type StreakState = {
  current: number
  best: number
  lastCheckedDay: string
}

export function updateCleanStreak(todayKey: string): StreakState {
  const lastChecked = localStorage.getItem('lastCheckedDay') ?? todayKey
  let current = Number(localStorage.getItem('currentCleanStreak') ?? '0')
  let best = Number(localStorage.getItem('bestCleanStreak') ?? '0')

  // lastChecked から todayKey の前日までを処理
  const start = parseJst(lastChecked)
  const end = parseJst(todayKey)

  // 同日なら何もしない
  if (getJstDate(start) === getJstDate(end)) {
    return { current, best, lastCheckedDay: lastChecked }
  }

  // startの翌日から endの当日まで進める（昨日分を評価したいので、当日到達まで回す）
  let cursor = start
  while (getJstDate(cursor) !== getJstDate(end)) {
    const dayKey = getJstDate(cursor)
    const dayCount = Number(localStorage.getItem(`day:${dayKey}`) ?? '0')

    // その日が0なら清潔達成（streak+1）、0以外ならリセット
    if (dayCount === 0) {
      current += 1
      if (current > best) best = current
    } else {
      current = 0
    }

    cursor = addDays(cursor, 1)
  }

  localStorage.setItem('currentCleanStreak', String(current))
  localStorage.setItem('bestCleanStreak', String(best))
  localStorage.setItem('lastCheckedDay', todayKey)

  return { current, best, lastCheckedDay: todayKey }
}