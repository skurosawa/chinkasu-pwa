import { updateCleanStreak } from './lib/streak'
import { useEffect, useMemo, useState } from 'react'

const getTodayKeyJST = () =>
  new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })

const [cleanStreak, setCleanStreak] = useState(0)
const [bestClean, setBestClean] = useState(0)

export default function App() {
  const todayKey = useMemo(() => getTodayKeyJST(), [])
  const [count, setCount] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const savedToday = localStorage.getItem(`day:${todayKey}`)
    const savedTotal = localStorage.getItem('totalCount')
    if (savedToday) setCount(Number(savedToday))
    if (savedTotal) setTotal(Number(savedTotal))
    const st = updateCleanStreak(todayKey)
    setCleanStreak(st.current)
    setBestClean(st.best)
  }, [todayKey])

  const badge = () => {
    if (count === 0) return 'きらきら清潔✨'
    if (count < 5) return 'ふわふわ平和🫧'
    if (count < 10) return 'そろそろおふろ🛁'
    if (count < 20) return 'リセット推奨🙂'
    return '⚠️ 危険かも…！'
  }

  const taunt = () => {
    if (count === 0) return '神清潔！そのまま光になろう✨'
    if (count < 5) return 'いい感じ〜！今日もえらい🫧'
    if (count < 10) return 'おふろ入ったら運気も上がるかも🛁'
    if (count < 20) return '今日は“清潔デー”にしよ？🙂'
    return '⚠️ ちょっと危険かも…まずはおふろ！'
  }

  const onAdd = () => {
    const next = count + 1
    const nextTotal = total + 1
    setCount(next)
    setTotal(nextTotal)
    localStorage.setItem(`day:${todayKey}`, String(next))
    localStorage.setItem('totalCount', String(nextTotal))
  }

  return (
    <div className="app">
      <h1>ちんかすカウンター🫧</h1>

      <div className="card">
        <p>今日のきろく</p>
        <div className="count">{count}</div>
        <div className="badge">{badge()}</div>
      </div>

      <button className="puni-btn" onClick={onAdd}>
        +1 きろくする
      </button>

      <div className="taunt">{taunt()}</div>

      <div className="stats">
        <span>累計: {total}</span>
        <span>・</span>
        <span>清潔連続: {cleanStreak}日</span>
        <span>・</span>
        <span>最長清潔: {bestClean}日</span>
      </div>
    </div>
    
  )
}
