// src/domain/danger.ts

export type DangerLevel =
  | 'low'
  | 'lowmid'
  | 'mid'
  | 'high'
  | 'extreme'
  | 'extreme2'

/**
 * 危険度パーセンテージ（0〜100）
 * point = 最後の🛁からの経過時間（hour）
 */
export function calcDangerPercent(
  point: number,
  maxPoint: number,
): number {
  if (maxPoint <= 0) return 0
  const p = Math.max(0, point)
  return Math.min(100, Math.round((p / maxPoint) * 100))
}

/**
 * 危険度レベル（6段階）
 * 72時間MAXモデル
 */
export function getDangerLevel(point: number): DangerLevel {
  if (point >= 72) return 'extreme2'
  if (point >= 48) return 'extreme'
  if (point >= 36) return 'high'
  if (point >= 24) return 'mid'
  if (point >= 12) return 'lowmid'
  return 'low'
}

/**
 * 危険度コメント
 */
export function getDangerComment(point: number): string {
  if (point >= 72) return '……今すぐおふろ。ね？（ほんき）'
  if (point >= 48) return '放置姫しすぎ…？今すぐおふろ行こ？'
  if (point >= 36) return 'ほんとに今日は入ろ？ね？'
  if (point >= 24) return 'そろそろおふろしたくなってきたかも？'
  if (point >= 12) return '今日もちゃんとキープできてるね〜♡'
  return 'きらきら清潔〜 えらいっ♡'
}

/**
 * 危険域かどうか（UI空気変化用）
 */
export function isDangerZone(point: number): boolean {
  return point >= 48
}

/**
 * UIまとめ取得（便利関数）
 */
export function buildDangerState(
  point: number,
  maxPoint: number,
) {
  const percent = calcDangerPercent(point, maxPoint)
  const level = getDangerLevel(point)
  const comment = getDangerComment(point)
  const isDanger = isDangerZone(point)

  return {
    percent,
    level,
    comment,
    isDanger,
  }
}