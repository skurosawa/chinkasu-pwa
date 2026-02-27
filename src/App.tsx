import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { calcPoint, MAX_POINT } from './lib/points'
import { loadBathEvents, appendBathEvent } from './lib/bathHistory'
import { copyText, tryNativeShare } from './lib/share'

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
  // point = 「最後の🛁からの経過時間（h）」として維持（危険度ゲージに使う）
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

  // ✅ 🛁ボタン押下エフェクト
  const [bathFx, setBathFx] = useState(false)

  // ✅ 神清潔段階（7 / 14 / 30）
  const cleanTier = useMemo(() => {
    const s = cleanStreak
    if (s >= 30) return { key: 'legend', label: '伝説清潔', badge: '👑' }
    if (s >= 14) return { key: 'super', label: '超神清潔', badge: '💖' }
    if (s >= 7) return { key: 'god', label: '神清潔', badge: '✨' }
    return { key: 'none', label: '', badge: '' }
  }, [cleanStreak])

  const isGodClean = cleanTier.key !== 'none'
  const historyRange: 7 | 30 = isGodClean ? 30 : 7

  // ✅ 起動時：前回が「一昨日以前」なら streak を折る
  useEffect(() => {
    const todayKey = getTodayKeyJST()
    const lastBathDay = safeGet('lastBathDay') ?? ''
    if (!lastBathDay) return

    const diff = diffDaysByDayKey(todayKey, lastBathDay)

    // 1日でも空いたら即リセット
    if (diff !== null && diff >= 2) {
      setCleanStreak(0)
      safeSet('currentCleanStreak', '0')
      safeSet('bestCleanStreak', String(bestClean)) // 念のため維持
    }
  }, [bestClean])

  // ✅ 1分ごと + iOS復帰時にポイント再計算（PWA安定性）
  useEffect(() => {
    const tick = () => {
      const p = calcPoint(nowMs(), lastResetAt, MAX_POINT)
      const v = Math.max(0, Math.floor(p))
      setPoint(v)
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

  // ✅ 危険度（0〜100） ※ MAX_POINT=72h
  const dangerPercent = Math.min(100, Math.round((point / MAX_POINT) * 100))

  // ✅ 6段階（12h刻みベース）※色用クラス
  const dangerLevel = useMemo(() => {
    if (point >= 72) return 'extreme2' // 72h〜
    if (point >= 48) return 'extreme' // 48〜71h
    if (point >= 36) return 'high' // 36〜47h
    if (point >= 24) return 'mid' // 24〜35h
    if (point >= 12) return 'lowmid' // 12〜23h
    return 'low' // 0〜11h
  }, [point])

  // ✅ ゲージ下コメント（6段階）
  const dangerComment = useMemo(() => {
    if (point >= 72) return '……今すぐおふろ。ね？（ほんき）'
    if (point >= 48) return '放置姫しすぎ…？今すぐおふろ行こ？'
    if (point >= 36) return 'ほんとに今日は入ろ？ね？'
    if (point >= 24) return 'そろそろおふろしたくなってきたかも？'
    if (point >= 12) return '今日もちゃんとキープできてるね〜♡'
    return 'きらきら清潔〜 えらいっ♡'
  }, [point])

  // ✅ 画面の空気（危険域）：48h〜で空気を変える
  const isDanger = point >= 48

  const buildShareText = () => {
    const streakText = cleanStreak <= 1 ? '1日目' : `${cleanStreak}日連続`
    const sparkle = isGodClean ? ' ✨' : ''
    // URLは入れない（要望）
    return `🛁 おふろ入った〜 🫧 ${streakText}${sparkle}
#ふろキャン`
  }

  const onShare = async () => {
    const text = buildShareText()
    const shared = await tryNativeShare({ text })
    if (!shared) await copyText(text)
  }

  const onBathReset = () => {
    // ✅ 押下演出（軽量）
    setBathFx(true)
    window.setTimeout(() => setBathFx(false), 400)

    const before = point
    const t = nowMs()
    const todayKey = getTodayKeyJST()

    appendBathEvent({ ts: t, dayKey: todayKey, pointBefore: before })

    safeSet('lastResetAt', String(t))
    setLastResetAt(t)
    setPoint(0)

    const lastBathDay = safeGet('lastBathDay') ?? ''

    // ✅ 同じ日は加算しない（多押し対策）
    if (lastBathDay === todayKey) return

    // ✅ 日付差で「連続 or リセット」を決める
    const diff = lastBathDay ? diffDaysByDayKey(todayKey, lastBathDay) : null

    const next = diff === 1 ? cleanStreak + 1 : 1
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

    // ✅ 0回の日は“薄いドット”（高さ0）にして描画分岐
    const items = days.map((d) => {
      if (d.count === 0) return { ...d, height: 0 }
      const height = Math.max(10, Math.round((d.count / max) * maxHeight))
      return { ...d, height }
    })

    return { items }
  }, [historyRange, cleanStreak])

  return (
    <div className={`app ${isDanger ? 'dangerMode' : ''}`}>
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
        <section className="hero" aria-label="連続日数と危険度">
          <div className="heroNumber">
            <span className="heroValue">{cleanStreak}</span>
            <span className="heroUnit">日連続</span>
          </div>

          {/* ✅ 危険度ゲージ：風呂に入ってない時間（最大72h） */}
          <div className="gaugeWrap">
            <div
              className={[
                'gauge',
                dangerLevel,
                dangerPercent === 0 ? 'isZero' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              <div className="gaugeFill" style={{ width: `${dangerPercent}%` }} />
            </div>

            {/* ✅ コメント付きバッジ（押せない・増えすぎない） */}
            <div
              className={[
                'dangerBadge',
                `dangerBadge--${dangerLevel}`,
              ].join(' ')}
              aria-hidden="true"
            >
              {dangerComment}
            </div>
          </div>
        </section>

        <div className="cta">
          <button
            className={`bathCta ${bathFx ? 'bathFx' : ''}`}
            onClick={onBathReset}
            aria-label="おふろ入った"
          >
            <span className="bathEmoji" aria-hidden="true">
              🛁
            </span>
            <span className="bathLabel">おふろ入った</span>
          </button>
        </div>

        <section className="historyPanel" aria-label="履歴">
          <div className="panelHeader">
            <h2 className="panelTitle">履歴</h2>

            <button
              type="button"
              className="shareBtn"
              onClick={onShare}
              aria-label="共有"
            >
              <svg className="shareIcon" viewBox="0 0 24 24" aria-hidden="true">
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
                  <div className="historyBar" style={{ height: `${d.height}px` }} />
                ) : (
                  <div className="historyDot" aria-hidden="true" />
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