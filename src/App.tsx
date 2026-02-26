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

  // ✅ 神清潔トースト（到達した瞬間だけ）
  const [showGodToast, setShowGodToast] = useState(false)
  const prevStreakRef = useRef<number>(cleanStreak)

  // ✅ 履歴レンジ（7日 / 30日）
  const [historyRange, setHistoryRange] = useState<7 | 30>(7)

  // ✅ 神清潔段階（7 / 14 / 30）
  const cleanTier = useMemo(() => {
    const s = cleanStreak
    if (s >= 30) return { key: 'legend', label: '伝説清潔', badge: '👑', min: 30 }
    if (s >= 14) return { key: 'super', label: '超神清潔', badge: '💖', min: 14 }
    if (s >= 7) return { key: 'god', label: '神清潔', badge: '✨', min: 7 }
    return { key: 'none', label: '', badge: '', min: 0 }
  }, [cleanStreak])

  const isGodClean = cleanTier.key !== 'none'

  // 起動時に履歴の最新を読む
  useEffect(() => {
    const events = loadBathEvents()
    const last = events.at(-1)
    setLastBathPoint(last ? last.pointBefore : null)
  }, [])

  // ✅ 7日到達した瞬間だけ祝う（段階が変わった瞬間に出す）
  useEffect(() => {
    const prev = prevStreakRef.current

    const crossed7 = prev < 7 && cleanStreak >= 7
    const crossed14 = prev < 14 && cleanStreak >= 14
    const crossed30 = prev < 30 && cleanStreak >= 30

    if (crossed7 || crossed14 || crossed30) {
      setShowGodToast(true)
      window.setTimeout(() => setShowGodToast(false), 1600)
    }

    prevStreakRef.current = cleanStreak
  }, [cleanStreak])

  // 1分ごとにポイント再計算
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

  // ✅ 神清潔中はピンク浄化ゲージにする
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

  // 🫧 履歴（自動スケーリング + 7/30）
  const historyData = useMemo(() => {
    const events = loadBathEvents()
    const now = new Date()

    const days: { key: string; label: string; count: number }[] = []
    for (let i = historyRange - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)

      const key = d.toLocaleDateString('ja-JP', {
        timeZone: 'Asia/Tokyo',
      })

      const count = events.filter((e) => e.dayKey === key).length
      const label = key.slice(5) // "MM/DD"

      days.push({ key, label, count })
    }

    const max = Math.max(1, ...days.map((d) => d.count))
    const maxHeight = 72

    const items = days.map((d) => {
      const height =
        d.count === 0 ? 0 : Math.max(8, Math.round((d.count / max) * maxHeight))
      return { ...d, height }
    })

    return { max, items }
  }, [historyRange, cleanStreak, lastBathPoint])

  const toastText = () => {
    if (cleanTier.key === 'legend') return '👑 伝説清潔になった！'
    if (cleanTier.key === 'super') return '💖 超神清潔になった！'
    if (cleanTier.key === 'god') return '✨ 神清潔達成！'
    return '✨ いい感じ！'
  }

  return (
    <div className="app">
      <h1>ふろキャン♡</h1>

      {/* ✅ ヘッダー直下：段階バッジ */}
      {isGodClean && (
        <div className={`godBadge godBadge--${cleanTier.key}`}>
          {cleanTier.badge} {cleanTier.label}モード {cleanTier.badge}
          <span className="godBadgeSub">清潔連続 {cleanStreak} 日</span>
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
          {isGodClean ? `${cleanTier.label}浄化度` : '危険度'}: {dangerPercent}%
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
        <div className="historyHeader">
          <p className="historyTitle">🫧 リセット履歴</p>

          <div className="historyTabs" role="tablist" aria-label="履歴レンジ">
            <button
              type="button"
              className={`historyTab ${historyRange === 7 ? 'active' : ''}`}
              onClick={() => setHistoryRange(7)}
            >
              7日
            </button>
            <button
              type="button"
              className={`historyTab ${historyRange === 30 ? 'active' : ''}`}
              onClick={() => setHistoryRange(30)}
            >
              30日
            </button>
          </div>
        </div>

        <div className={`historyBars ${historyRange === 30 ? 'monthly' : ''}`}>
          {historyData.items.map((d) => (
            <div key={d.key} className="historyItem">
              <div
                className="historyBar"
                style={{ height: `${d.height}px` }}
                title={`${d.label}：${d.count}回`}
              />
              <span className="historyDay">{d.label}</span>
            </div>
          ))}
        </div>

        <div className="historyMeta">
          <span>最大: {historyData.max}回</span>
        </div>
      </div>

      {/* ✅ 段階到達トースト */}
      {showGodToast && (
        <div className="godToast" aria-live="polite">
          <div className="godToastInner">{toastText()}</div>
        </div>
      )}
    </div>
  )
}
