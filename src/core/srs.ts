import type { WordProgress } from './types'

export const DAY_MS = 24 * 60 * 60 * 1000
export const MIN_EF = 1.3
export const MAX_EF = 2.8

export function createProgress(now: number): WordProgress {
  return {
    streak: 0,
    correct: 0,
    wrong: 0,
    mastered: false,
    lastSeenAt: now,
    ef: 2.5,
    intervalDays: 0,
    dueAt: now
  }
}

/**
 * 简化版 SM-2（艾宾浩斯间隔重复）：
 * - 答对：间隔 1 天 → 3 天 → 上次间隔 × 难度因子，难度因子上调
 * - 答错：间隔归零（10 分钟后重现），难度因子下调
 */
export function nextSrs(
  progress: Pick<WordProgress, 'ef' | 'intervalDays'>,
  correct: boolean,
  now: number
): Pick<WordProgress, 'ef' | 'intervalDays' | 'dueAt'> {
  if (!correct) {
    const ef = Math.max(MIN_EF, progress.ef - 0.2)
    return { ef, intervalDays: 0, dueAt: now + 10 * 60 * 1000 }
  }

  const ef = Math.min(MAX_EF, progress.ef + 0.1)
  let intervalDays: number
  if (progress.intervalDays <= 0) intervalDays = 1
  else if (progress.intervalDays === 1) intervalDays = 3
  else intervalDays = Math.round(progress.intervalDays * ef)

  return { ef, intervalDays, dueAt: now + intervalDays * DAY_MS }
}

/** 是否需要复习 */
export function isDue(progress: WordProgress | undefined, now: number): boolean {
  if (!progress) return true
  if (progress.mastered) return false
  return progress.dueAt <= now
}

/** 错题重现的插入间隔（题数） */
export function replayGap(mode: 'immediate' | 'interval' | 'endOfRound' | 'srs', interval: number): number {
  switch (mode) {
    case 'immediate':
      return 1
    case 'interval':
      return Math.max(1, Math.min(50, Math.round(interval)))
    case 'srs':
      return 5
    case 'endOfRound':
      return Number.MAX_SAFE_INTEGER
    default:
      return 1
  }
}
