import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { calcPoint, MAX_POINT } from './lib/points'
import { loadBathEvents, appendBathEvent } from './lib/bathHistory'

const getTodayKeyJST = () =>
  new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })

const nowMs = () => Date.now()

const getOrInitLastResetAt = () => {
  const v = localStorage.getItem('lastResetAt')
  if (v) return Number(v)
  const t = nowMs()
  localStorage.setItem('lastResetAt', String(t))
  return t
}

export default function App() {
  const todayKey = useMemo(() => getTodayKeyJST(), [])

  const [point, setPoint] = useState(0)
  const [lastResetAt, setLastResetAt] = useState<number>(() =>
    getOrInitLastResetAt(),
  )

  const [cleanStreak, setCleanStreak] = useState<number>(() =>
    Number(localStorage.getItem('currentCleanStreak') ?? '0'),
  )

  const [bestClean, setBestClean] = useState<number>(() =>
    Number(localStorage.getItem('bestCleanStreak') ?? '0'),
  )

  const [lastBathPoint, setLastBathPoint] = useState<number | null>(null)

  // 神清潔トースト
  const [showGodToast, setShowGodToast] = useState(false)
  const prevStreakRef = useRef<number>(cleanStreak)

  const isGodClean = cleanStreak >= 7

  // 起動時に履歴読み込み
  useEffect(() => {
    const events = loadBathEvents()
    const last = events.at(-1)
    setLastBathPoint(last ? last.pointBefore : null)
  }, [])

  // 7日到達時トースト
  useEffect(() => {
    const prev = prevStreakRef.current
    if (prev < 7 && cleanStreak >= 7) {
      setShowGodToast(true)
      window.setTimeout(() => setShowGodToast(false), 1600)
    }
    prevStreakRef.current = cleanStreak
  }, [cleanStreak])

  // 1分ごと再計算
  useEffect(() => {
    const tick = () => {
      const p = calcPoint(nowMs(), lastResetAt, MAX_POINT)
      setPoint(p)
    }
    tick()
    const id = window.setInterval(tick, 60 * 1000)
    return () => window.clearInterval(id)
  }, [lastResetAt])

  const dangerPercent = Math.round((point / MAX_POINT) * 100)
  const isDanger = point >= 24

  const gaugeFillClass = isGodClean
    ? 'gaugeFill godGaugePink'
    : 'gaugeFill'

  const badge = () => {
    if (point === 0) return 'きらきら清潔✨'
    if (point < 4) return 'ふわふわ平和🫧'
    if (point < 12) return 'そろそろおふろ🛁'
    if (point < 24) return 'リセット推奨🙂'
    return '⚠️ 危険かも…！'
  }

  const taunt = () => {
    if (point === 0) return '神清潔！そのまま光になろう✨'
    if (point < 4) return 'いい感じ〜！今日もえらい🫧'
    if (point < 12) return 'おふろ入ったら運気も上がるかも🛁'
    if (point < 24) return '今日は“清潔デー”にしよ？🙂'
    return '⚠️ ちょっと危険かも…まずはおふろ！'
  }

  const onBathReset = () => {
    const before = point
    const t = nowMs()

    appendBathEvent({ ts: t, dayKey: todayKey, pointBefore: before })
    setLastBathPoint(before)

    localStorage.setItem('lastResetAt', String(t))
    setLastResetAt(t)
    setPoint(0)

    const lastBathDay = localStorage.getItem('lastBathDay') ?? ''
    if (lastBathDay !== todayKey) {
      const next = cleanStreak + 1
      const nextBest = Math.max(bestClean, next)

      setCleanStreak(next)
      setBestClean(nextBest)

      localStorage.setItem('currentCleanStreak', String(next))
      localStorage.setItem('bestCleanStreak', String(nextBest))
      localStorage.setItem('lastBathDay', todayKey)
    }
  }

  // 🫧 直近7日リセット回数
  const weeklyCounts = useMemo(() => {
    const events = loadBathEvents()
    const result: { day: string; count: number }[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)

      const key = d.toLocaleDateString('ja-JP', {
        timeZone: 'Asia/Tokyo',
      })

      const count = events.filter((e) => e.dayKey === key).length
      result.push({ day: key.slice(5), count })
    }

    return result
  }, [cleanStreak, lastBathPoint])

  return (
    <div className="app">
      <h1>ふろキャン♡ 🫧</h1>

      {isGodClean && (
        <div className="godBadge">
          ✨ 神清潔モード ✨
          <span className="godBadgeSub">
            清潔連続 {cleanStreak} 日
          </span>
        </div>
      )}

      <div className="card">
        <p>現在ポイント（1時間で+1）</p>

        <div className="count">{point}</div>

        <div className="gauge">
          <div
            className={gaugeFillClass}
            style={{ width: `${dangerPercent}%` }}
          />
        </div>

        <div className={`gaugeLabel ${isDanger ? 'danger' : ''}`}>
          {isGodClean ? '神浄化度' : '危険度'}: {dangerPercent}%
        </div>

        <div className="badge">{badge()}</div>
      </div>

      <button className="puni-btn" onClick={onBathReset}>
        🛁 おふろでリセット
      </button>

      <div className="taunt">{taunt()}</div>

      <div className="stats">
        <span>清潔連続: {cleanStreak}日</span>
        <span>・</span>
        <span>最長清潔: {bestClean}日</span>
        <span>・</span>
        <span>上限: {MAX_POINT}</span>
        <span>・</span>
        <span>
          直近🛁: {lastBathPoint === null ? '-' : `${lastBathPoint}→0`}
        </span>
      </div>

      {/* 🫧 履歴グラフ */}
      <div className="history">
        <p className="historyTitle">🫧 直近7日リセット</p>

        <div className="historyBars">
          {weeklyCounts.map((d) => (
            <div key={d.day} className="historyItem">
              <div
                className="historyBar"
                style={{ height: `${d.count * 16}px` }}
              />
              <span className="historyDay">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {showGodToast && (
        <div className="godToast" aria-live="polite">
          <div className="godToastInner">
            ✨ 神清潔達成！ ✨
          </div>
        </div>
      )}
    </div>
  )
}
