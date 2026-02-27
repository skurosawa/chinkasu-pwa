// src/lib/points.ts

export const MAX_POINT = 72

/**
 * 危険度レベル（6段階）
 * Swift移植時も同じenum構造にすると移しやすい
 */
export type DangerLevel =
  | 'low'       // 0〜11h
  | 'lowmid'    // 12〜23h
  | 'mid'       // 24〜35h
  | 'high'      // 36〜47h
  | 'extreme'   // 48〜71h
  | 'extreme2'  // 72h〜

/**
 * 1時間で +1pt（最大 MAX_POINT）
 * @param nowMs 現在時刻(ms)
 * @param lastResetAt 最後に🛁した時刻(ms)
 * @param max 最大ポイント（時間）
 */
export function calcPoint(
  nowMs: number,
  lastResetAt: number,
  max: number = MAX_POINT,
): number {
  const diff = Math.max(0, nowMs - lastResetAt)
  const hours = diff / (60 * 60 * 1000)
  return Math.min(max, hours)
}

/**
 * 危険度レベル判定（UIから分離）
 * pointは整数でも小数でもOK
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
 * 危険度コメント（世界観をドメイン側に固定）
 * Swift版でもこの条件をそのまま再現すれば仕様一致
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
 * 危険度パーセント（0〜100）
 * ゲージ用。UIで計算しないためにここへ集約。
 */
export function getDangerPercent(point: number): number {
  return Math.min(100, Math.round((point / MAX_POINT) * 100))
}