import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { calcPoint, MAX_POINT } from './lib/points'
import { loadBathEvents, appendBathEvent } from './lib/bathHistory'
import { copyText, tryNativeShare } from './lib/share'

const nowMs = () => Date.now()

const getTodayKeyJST = () =>
  new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })

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

const getOrInitLastResetAt = () => {
  const v = safeGet('lastResetAt')
  if (v) return Number(v)
  const t = nowMs()
  safeSet('lastResetAt', String(t))
  return t
}

const parseDayKey = (
  key: string,
): { y: number; m: number; d: number } | null => {
  if (!key) return null
  const parts = key.split(/[^\d]+/).filter(Boolean).map(Number)
  if (parts.length < 3) return null
  const [y, m, d] = parts
  if (!y || !m || !d) return null
  return { y, m, d }
}

const diffDaysByDayKey = (todayKey: string, lastKey: string): number | null => {
  const a = parseDayKey(todayKey)
  const b = parseDayKey(lastKey)
  if (!a || !b) return null

  const dayA = Math.floor(Date.UTC(a.y, a.m - 1, a.d) / 86400000)
  const dayB = Math.floor(Date.UTC(b.y, b.m - 1, b.d) / 86400000)
  return dayA - dayB
}

export default function App() {
  const [point, setPoint] = useState(0)
  const [lastResetAt, setLastResetAt] = useState<number>(() =>
    getOrInitLastResetAt(),
  )

  const [cleanStreak, setCleanStreak] = useState<number>(() =>
    Number(safeGet('currentCleanStreak') ?? '0'),
  )
  const [bestClean, setBestClean] = useState<number>(() =>
    Number(safeGet('bestCleanStreak') ?? '0'),
  )

  const [bathFx, setBathFx] = useState(false)

  const cleanTier = useMemo(() => {
    const s = cleanStreak
    if (s >= 30) return { key: 'legend', label: '伝説清潔', badge: '👑' }
    if (s >= 14) return { key: 'super', label: '超神清潔', badge: '💖' }
    if (s >= 7) return { key: 'god', label: '神清潔', badge: '✨' }
    return { key: 'none', label: '', badge: '' }
  }, [cleanStreak])

  const isGodClean = cleanTier.key !== 'none'
  const historyRange: 7 | 30 = isGodClean ? 30 : 7

  useEffect(() => {
    const todayKey = getTodayKeyJST()
    const lastBathDay = safeGet('lastBathDay') ?? ''
    if (!lastBathDay) return

    const diff = diffDaysByDayKey(todayKey, lastBathDay)
    if (diff !== null && diff >= 2) {
      setCleanStreak(0)
      safeSet('currentCleanStreak', '0')
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      const p = calcPoint(nowMs(), lastResetAt, MAX_POINT)
      setPoint(Math.max(0, Math.floor(p)))
    }

    tick()
    const id = window.setInterval(tick, 60000)

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tick()
    })

    return () => window.clearInterval(id)
  }, [lastResetAt])

  const buildShareText = () => {
    const streakText = cleanStreak <= 1 ? '1日目' : `${cleanStreak}日連続`
    const sparkle = isGodClean ? ' ✨' : ''
    return `🛁 おふろ入った〜 🫧 ${streakText}${sparkle}
#ふろキャン`
  }

  const onShare = async () => {
    const text = buildShareText()
    const shared = await tryNativeShare({ text })
    if (!shared) await copyText(text)
  }

  const onBathReset = () => {
    setBathFx(true)
    window.setTimeout(() => setBathFx(false), 400)

    const t = nowMs()
    const todayKey = getTodayKeyJST()

    appendBathEvent({ ts: t, dayKey: todayKey, pointBefore: point })

    safeSet('lastResetAt', String(t))
    setLastResetAt(t)
    setPoint(0)

    const lastBathDay = safeGet('lastBathDay') ?? ''
    if (lastBathDay === todayKey) return

    const diff = lastBathDay ? diffDaysByDayKey(todayKey, lastBathDay) : null
    const next = diff === 1 ? cleanStreak + 1 : 1
    const nextBest = Math.max(bestClean, next)

    setCleanStreak(next)
    setBestClean(nextBest)

    safeSet('currentCleanStreak', String(next))
    safeSet('bestCleanStreak', String(nextBest))
    safeSet('lastBathDay', todayKey)
  }

  const dangerPercent = Math.round((point / MAX_POINT) * 100)

  const historyData = useMemo(() => {
    const events = loadBathEvents()
    const now = new Date()

    const days: { key: string; label: string; count: number }[] = []
    for (let i = historyRange - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)

      const key = d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })
      const count = events.filter((e) => e.dayKey === key).length
      const label = key.slice(5)
      days.push({ key, label, count })
    }

    const max = Math.max(1, ...days.map((d) => d.count))
    const maxHeight = 72

    const items = days.map((d) =>
      d.count === 0
        ? { ...d, height: 0 }
        : {
            ...d,
            height: Math.max(10, Math.round((d.count / max) * maxHeight)),
          },
    )

    return { items }
  }, [historyRange, cleanStreak])

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1 className="brandTitle">ふろキャン♡</h1>
          {isGodClean && (
            <span className={`godBadge godBadge--${cleanTier.key}`}>
              {cleanTier.badge} {cleanTier.label}
            </span>
          )}
        </div>
      </header>

      <main className="stage">
        <section className="hero">
          <div className="heroNumber">
            <span className="heroValue">{point}</span>
            <span className="heroUnit">pt</span>
          </div>

          <div className="gaugeWrap">
            <div className="gauge">
              <div
                className="gaugeFill"
                style={{ width: `${dangerPercent}%` }}
              />
            </div>
          </div>
        </section>

        <div className="cta">
          <button
            className={`bathCta ${bathFx ? 'bathFx' : ''}`}
            onClick={onBathReset}
          >
            🛁 おふろ入った
          </button>
        </div>

        <section className="historyPanel">
          <div className="panelHeader">
            <h2 className="panelTitle">履歴</h2>

            <button
              type="button"
              className="shareBtn"
              onClick={onShare}
              aria-label="共有"
            >
              <svg
                className="shareIcon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M7 10.5H6.5c-1.1 0-2 .9-2 2v6.5c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2v-6.5c0-1.1-.9-2-2-2H17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 14V3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M8.7 6.8 12 3.5l3.3 3.3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="historyBars">
            {historyData.items.map((d) => (
              <div key={d.key} className="historyItem">
                {d.height > 0 ? (
                  <div
                    className="historyBar"
                    style={{ height: `${d.height}px` }}
                  />
                ) : (
                  <div className="historyDot" />
                )}
                <span className="historyDay">{d.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}