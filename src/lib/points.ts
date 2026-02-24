// src/lib/points.ts
export const POINT_UNIT_MS = 60 * 60 * 1000 // 1 hour
export const MAX_POINT = 48

export function calcPoint(nowMs: number, lastResetAtMs: number, cap = MAX_POINT) {
  const elapsed = Math.max(0, nowMs - lastResetAtMs)
  const hours = Math.floor(elapsed / POINT_UNIT_MS)
  return Math.min(hours, cap)
}