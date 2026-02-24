// src/lib/bathHistory.ts
export type BathEvent = {
  ts: number // Unix ms
  dayKey: string // 'YYYY/MM/DD' (JST)
  pointBefore: number
}

const STORAGE_KEY = 'bathEvents'
const MAX_EVENTS = 200

export function loadBathEvents(): BathEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BathEvent[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e) =>
          typeof e?.ts === 'number' &&
          typeof e?.dayKey === 'string' &&
          typeof e?.pointBefore === 'number',
      )
      .sort((a, b) => a.ts - b.ts)
  } catch {
    return []
  }
}

export function appendBathEvent(event: BathEvent): BathEvent[] {
  const events = loadBathEvents()
  events.push(event)
  const trimmed = events.slice(-MAX_EVENTS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  return trimmed
}