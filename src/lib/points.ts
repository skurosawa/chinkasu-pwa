export const MAX_POINT = 72

/**
 * 1時間で +1pt（最大 MAX_POINT）
 * @param nowMs 現在時刻(ms)
 * @param lastResetAt 最後に🛁した時刻(ms)
 * @param max 最大ポイント（時間）
 */
export function calcPoint(nowMs: number, lastResetAt: number, max: number) {
  const diff = Math.max(0, nowMs - lastResetAt)
  const hours = diff / (60 * 60 * 1000)
  return Math.min(max, hours)
}