import type { DictEntry, QuestionType } from './types'

/** 按字母顺序排列（大小写不敏感，稳定） */
export function alphaOrder(entries: readonly DictEntry[]): DictEntry[] {
  return entries
    .slice()
    .sort((a, b) => (a.w.toLowerCase() < b.w.toLowerCase() ? -1 : a.w.toLowerCase() > b.w.toLowerCase() ? 1 : 0))
}

/** 每个首字母的词量统计（A–Z） */
export function letterCounts(entries: readonly DictEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of entries) {
    const letter = entry.w[0]?.toUpperCase() ?? '#'
    counts[letter] = (counts[letter] ?? 0) + 1
  }
  return counts
}

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** 某本词书实际拥有的首字母（保持 A–Z 顺序） */
export function availableLetters(entries: readonly DictEntry[]): string[] {
  const counts = letterCounts(entries)
  return ALPHABET.filter((letter) => (counts[letter] ?? 0) > 0)
}

/** 从指定首字母开始的第一个词条在 alphaOrder 中的下标；找不到返回 0 */
export function startIndexForLetter(ordered: readonly DictEntry[], letter: string): number {
  const target = letter.toUpperCase()
  const index = ordered.findIndex((entry) => (entry.w[0]?.toUpperCase() ?? '') === target)
  return index < 0 ? 0 : index
}

/** 从 cursor 处连续取 size 个词条；到头后从头循环，保证总能凑满一轮 */
export function takeFrom(ordered: readonly DictEntry[], cursor: number, size: number): DictEntry[] {
  if (ordered.length === 0 || size <= 0) return []
  const out: DictEntry[] = []
  const total = Math.min(size, ordered.length)
  for (let i = 0; i < total; i += 1) {
    out.push(ordered[(cursor + i) % ordered.length])
  }
  return out
}

export interface RoundPlan {
  /** 本轮首次出现的词条 */
  words: DictEntry[]
  /** 本轮结束后应更新的字母顺序游标（仅 alpha 模式有意义） */
  nextCursor: number
}

/**
 * 生成本轮的首次出题词表。
 * - alpha：按字母顺序从 cursor 连续取，到头循环
 * - random：整本词书洗牌后取前 size 个
 * - mistakes：由错题本决定，调用方直接提供 words
 */
export function planRound(params: {
  mode: 'alpha' | 'random'
  ordered: readonly DictEntry[]
  cursor: number
  size: number
  shuffle: <T>(list: readonly T[]) => T[]
}): RoundPlan {
  const { ordered, cursor, size } = params
  if (ordered.length === 0) return { words: [], nextCursor: 0 }

  if (params.mode === 'random') {
    const picked = params.shuffle(ordered).slice(0, Math.min(size, ordered.length))
    return { words: picked, nextCursor: cursor }
  }

  const words = takeFrom(ordered, cursor, size)
  return { words, nextCursor: (cursor + words.length) % ordered.length }
}

/** 拼写题更适合单词语条；优先给出不含空格的词条 */
export function preferSpellable(entries: readonly DictEntry[]): DictEntry[] {
  const single = entries.filter((entry) => !entry.w.includes(' '))
  return single.length >= 8 ? single : entries.slice()
}

/**
 * 需要在各种题型之间出题时，确保池子里至少有足够的可用词条。
 * 选项类题目至少需要 4 个释义互不相同的词条。
 */
export function hasEnoughForChoice(entries: readonly DictEntry[]): boolean {
  const texts = new Set(entries.map((entry) => entry.t.join('；')))
  return entries.length >= 4 && texts.size >= 4
}

export type TypePicker = (index: number) => QuestionType
