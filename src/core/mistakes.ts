import type { DictEntry, MistakeEntry, WordProgress } from './types'
import { createProgress, nextSrs } from './srs'

export type MistakeMap = Record<string, MistakeEntry>
export type ProgressMap = Record<string, WordProgress>

export function wordKey(bookId: string, word: string): string {
  return `${bookId}:${word}`
}

export function makeMistake(bookId: string, entry: DictEntry, input: string, now: number): MistakeEntry {
  return {
    key: wordKey(bookId, entry.w),
    bookId,
    word: entry.w,
    trans: entry.t,
    us: entry.us,
    uk: entry.uk,
    wrong: 1,
    lastWrongInput: input,
    lastWrongAt: now,
    correctStreak: 0
  }
}

/** 记录一次答错：累加错误次数，清零连对 */
export function recordWrong(
  mistakes: MistakeMap,
  bookId: string,
  entry: DictEntry,
  input: string,
  now: number
): MistakeMap {
  const key = wordKey(bookId, entry.w)
  const existing = mistakes[key]
  const next: MistakeEntry = existing
    ? {
        ...existing,
        word: entry.w,
        trans: entry.t,
        us: entry.us ?? existing.us,
        uk: entry.uk ?? existing.uk,
        wrong: existing.wrong + 1,
        correctStreak: 0,
        lastWrongAt: now,
        lastWrongInput: input
      }
    : makeMistake(bookId, entry, input, now)
  return { ...mistakes, [key]: next }
}

/**
 * 记录一次答对（针对错题本里的词）。
 * 连续答对达到 clearStreak 次后移出错题本。
 */
export function recordCorrect(
  mistakes: MistakeMap,
  bookId: string,
  word: string,
  clearStreak: number
): MistakeMap {
  const key = wordKey(bookId, word)
  const existing = mistakes[key]
  if (!existing) return mistakes

  const streak = existing.correctStreak + 1
  if (streak >= Math.max(1, clearStreak)) {
    const next = { ...mistakes }
    delete next[key]
    return next
  }
  return { ...mistakes, [key]: { ...existing, correctStreak: streak } }
}

/** 手动移出错题本 */
export function removeMistake(mistakes: MistakeMap, key: string): MistakeMap {
  if (!mistakes[key]) return mistakes
  const next = { ...mistakes }
  delete next[key]
  return next
}

/** 清空错题本 */
export function clearMistakes(): MistakeMap {
  return {}
}

/** 错题排序：默认按错误次数降序，其次最近出错时间降序 */
export function sortMistakes(mistakes: MistakeMap, by: 'wrong' | 'recent' = 'wrong'): MistakeEntry[] {
  const list = Object.values(mistakes)
  if (by === 'recent') {
    return list.sort((a, b) => b.lastWrongAt - a.lastWrongAt)
  }
  return list.sort((a, b) => b.wrong - a.wrong || b.lastWrongAt - a.lastWrongAt)
}

/** 按词书过滤错题 */
export function filterMistakes(mistakes: MistakeMap, bookId: string | 'all'): MistakeEntry[] {
  const list = Object.values(mistakes)
  return bookId === 'all' ? list : list.filter((item) => item.bookId === bookId)
}

/** 更新单词进度（含 SRS 排程与掌握判定） */
export function updateProgressMap(
  progress: ProgressMap,
  key: string,
  correct: boolean,
  now: number,
  clearStreak: number
): ProgressMap {
  const base = progress[key] ?? createProgress(now)
  const srs = nextSrs(base, correct, now)
  const streak = correct ? base.streak + 1 : 0
  const next: WordProgress = {
    ...base,
    ...srs,
    streak,
    correct: base.correct + (correct ? 1 : 0),
    wrong: base.wrong + (correct ? 0 : 1),
    mastered: streak >= Math.max(1, clearStreak),
    lastSeenAt: now
  }
  return { ...progress, [key]: next }
}

/** 统计已掌握词数 */
export function countMastered(progress: ProgressMap): number {
  let count = 0
  for (const item of Object.values(progress)) if (item.mastered) count += 1
  return count
}

/** 取某本书中已学习（有进度记录）的词数 */
export function countStudied(progress: ProgressMap, bookId: string): number {
  const prefix = `${bookId}:`
  let count = 0
  for (const key of Object.keys(progress)) if (key.startsWith(prefix)) count += 1
  return count
}
