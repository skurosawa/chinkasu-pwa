import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { calcPoint, MAX_POINT } from './lib/points'
import { loadBathEvents, appendBathEvent } from './lib/bathHistory'

const nowMs = () => Date.now()

// ✅ JSTの「日付キー」(例: 2026/2/27) ※既存互換のため維持
const getTodayKeyJST = () =>
  new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })

// ✅ localStorage 例外対策（iOSプライベート/制限などで落ちないように）
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

// ✅ "YYYY/M/D" or "YYYY/MM/DD" or "YYYY-MM-DD" を安全にパース
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

// ✅ JST日付キー同士の「日数差」を計算（today - last）
const diffDaysByDayKey = (todayKey: string, lastKey: string): number | null => {
  const a = parseDayKey(todayKey)
  const b = parseDayKey(lastKey)
  if (!a || !b) return null

  // JSTの「日付」同士なので、UTCの同日0時にマップして差分を取ればOK
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

  const [lastBathPoint, setLastBathPoint] = useState<number | null>(null)

  // ✅ 神清潔トースト（到達した瞬間だけ）
  const [showGodToast, setShowGodToast] = useState(false)
  const prevStreakRef = useRef<number>(cleanStreak)

  // ✅ 30日履歴ごほうび解放 演出（解放した瞬間だけ）
  const [showHistoryUnlockFx, setShowHistoryUnlockFx] = useState(false)
  const prevIsGodCleanRef = useRef<boolean>(false)

  // ✅ カウント演出（ポイント増加時だけふわっと）
  const [countPulse, setCountPulse] = useState(false)
  const prevPointRef = useRef<number>(0)

  // ✅ PWA更新トースト（非インタラクティブ）
  const [showPwaToast, setShowPwaToast] = useState(false)
  const [pwaToastText, setPwaToastText] = useState('')

  // ✅ 神清潔段階（7 / 14 / 30）
  const cleanTier = useMemo(() => {
    const s = cleanStreak
    if (s >= 30) return { key: 'legend', label: '伝説清潔', badge: '👑', min: 30 }
    if (s >= 14) return { key: 'super', label: '超神清潔', badge: '💖', min: 14 }
    if (s >= 7) return { key: 'god', label: '神清潔', badge: '✨', min: 7 }
    return { key: 'none', label: '', badge: '', min: 0 }
  }, [cleanStreak])

  const isGodClean = cleanTier.key !== 'none'

  // ✅ ごほうび解放：神清潔（7日以上）で30日履歴を自動解放
  const historyRange: 7 | 30 = isGodClean ? 30 : 7
  const historyRangeLabel = historyRange === 30 ? 'ごほうび30日' : '7日'

  // ✅ PWA更新イベント受信（main.tsx から飛んでくる）
  useEffect(() => {
    const show = (text: string) => {
      setPwaToastText(text)
      setShowPwaToast(true)
      window.setTimeout(() => setShowPwaToast(false), 1800)
    }

    const onUpdate = () => show('🫧 更新が入ったよ。次回起動で反映')
    const onOffline = () => show('✨ オフラインでも使えるようになった')

    window.addEventListener('pwa:update-available', onUpdate as EventListener)
    window.addEventListener('pwa:offline-ready', onOffline as EventListener)

    return () => {
      window.removeEventListener('pwa:update-available', onUpdate as EventListener)
      window.removeEventListener('pwa:offline-ready', onOffline as EventListener)
    }
  }, [])

  // 起動時に履歴の最新を読む
  useEffect(() => {
    const events = loadBathEvents()
    const last = events.at(-1)
    setLastBathPoint(last ? last.pointBefore : null)
  }, [])

  // ✅ 起動時：前回が「一昨日以前」なら streak を折る（表示もリセット）
  useEffect(() => {
    const todayKey = getTodayKeyJST()
    const lastBathDay = safeGet('lastBathDay') ?? ''
    if (!lastBathDay) return

    const diff = diffDaysByDayKey(todayKey, lastBathDay)
    if (diff !== null && diff >= 2) {
      // 連続は途切れた（今日はまだ押してないので 0 表示が自然）
      setCleanStreak(0)
      safeSet('currentCleanStreak', '0')
    }
  }, [])

  // ✅ 7/14/30 到達した瞬間だけ祝う（段階が変わった瞬間に出す）
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

  // ✅ 30日履歴の解放演出（初めて神清潔になった瞬間だけ）
  useEffect(() => {
    const prev = prevIsGodCleanRef.current
    const now = isGodClean

    if (!prev && now) {
      setShowHistoryUnlockFx(true)
      window.setTimeout(() => setShowHistoryUnlockFx(false), 1200)
    }

    prevIsGodCleanRef.current = now
  }, [isGodClean])

  // ✅ 1分ごと + iOS復帰時にポイント再計算（PWA安定性）
  useEffect(() => {
    const tick = () => {
      const p = calcPoint(nowMs(), lastResetAt, MAX_POINT)
      setPoint(p)
    }

    tick()
    const id = window.setInterval(tick, 60 * 1000)

    const onVis = () => {
      if (!document.hidden) tick()
    }
    const onFocus = () => tick()
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) tick()
      else tick()
    }

    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [lastResetAt])

  // ✅ ポイントが増えた瞬間だけ、数字をふわっと（押せない演出）
  useEffect(() => {
    const prev = prevPointRef.current
    if (point > prev && point > 0) {
      setCountPulse(true)
      window.setTimeout(() => setCountPulse(false), 260)
    }
    prevPointRef.current = point
  }, [point])

  const dangerPercent = Math.round((point / MAX_POINT) * 100)
  const isDanger = point >= 24

  // ✅ 神清潔中はピンク浄化ゲージにする
  const gaugeFillClass = isGodClean ? 'gaugeFill godGaugePink' : 'gaugeFill'

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
    const todayKey = getTodayKeyJST()

    appendBathEvent({ ts: t, dayKey: todayKey, pointBefore: before })
    setLastBathPoint(before)

    safeSet('lastResetAt', String(t))
    setLastResetAt(t)
    setPoint(0)

    const lastBathDay = safeGet('lastBathDay') ?? ''

    // ✅ 同じ日は加算しない（多押し対策）
    if (lastBathDay === todayKey) return

    // ✅ 日付差で「連続 or リセット」を決める
    const diff = lastBathDay ? diffDaysByDayKey(todayKey, lastBathDay) : null

    let next = 1
    if (diff === 1) {
      // 昨日も押してる＝連続
      next = cleanStreak + 1
    } else {
      // 一昨日以前 or 不明＝途切れたので1から
      next = 1
    }

    const nextBest = Math.max(bestClean, next)

    setCleanStreak(next)
    setBestClean(nextBest)

    safeSet('currentCleanStreak', String(next))
    safeSet('bestCleanStreak', String(nextBest))
    safeSet('lastBathDay', todayKey)
  }

  // 🫧 履歴（自動スケーリング + 7/30 自動）
  const historyData = useMemo(() => {
    const events = loadBathEvents()
    const now = new Date()

    const days: { key: string; label: string; count: number }[] = []
    for (let i = historyRange - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)

      const key = d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })
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
    <div className={`app ${isDanger ? 'dangerMode' : ''}`}>
      <h1>ふろキャン♡</h1>

      {isGodClean && (
        <div className={`godBadge godBadge--${cleanTier.key}`}>
          {cleanTier.badge} {cleanTier.label}モード {cleanTier.badge}
          <span className="godBadgeSub">清潔連続 {cleanStreak} 日</span>
        </div>
      )}

      <div className="card">
        <p>現在ポイント</p>
        <div className="cardSub">時間でふえる</div>

        <div className={`count ${countPulse ? 'pulse' : ''}`}>{point}</div>

        <div className="gauge">
          <div className={gaugeFillClass} style={{ width: `${dangerPercent}%` }} />
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
      </div>

      <div className="history">
        <div className="historyHeader">
          <p className="historyTitle">🫧 リセット履歴</p>

          <div className="historyHint" aria-label="履歴レンジ">
            <span
              className={[
                'historyPill',
                historyRange === 30 ? 'reward' : '',
                showHistoryUnlockFx ? 'unlockFx' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {historyRangeLabel}
            </span>

            {!isGodClean && (
              <span className="historyLock">✨ 7日で30日履歴が解放</span>
            )}
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

      {/* ✅ PWA更新/オフライン準備トースト（非インタラクティブ） */}
      {showPwaToast && (
        <div className="pwaToast" aria-live="polite">
          <div className="pwaToastInner">{pwaToastText}</div>
        </div>
      )}
    </div>
  )
}
