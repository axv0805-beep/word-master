import type { DictEntry } from './types'
import { cleanTrans, posOfEntry, type WordPos } from './pos'
import { candidatesForConfusable, type WordIndex } from './wordIndex'
import { commonPrefixLength, commonSuffixLength, editDistance, normalizePhonetic } from './textSimilarity'

export { editDistance, normalizePhonetic }

/**
 * 易混词：拼写或发音相近、容易记混的词。
 *
 * 与词形变化一样，只在**词库里真实存在**的词条中挑选，
 * 并给出「为什么像」的理由（形近 / 音近 / 同尾），方便有针对性地记忆。
 */

export type ConfusableReason = 'shape' | 'sound' | 'tail'

export const REASON_LABEL: Record<ConfusableReason, string> = {
  shape: '形近',
  sound: '音近',
  tail: '同尾'
}

export interface ConfusableWord {
  word: string
  trans: string[]
  meaning: string
  pos: WordPos | null
  /** 编辑距离 */
  distance: number
  score: number
  reason: ConfusableReason
}

export interface FindConfusablesOptions {
  /** 最多返回几个，默认 3 */
  limit?: number
  /** 音标最大差异，默认 1（放宽到 2 会把 cake / care 这种也算成音近） */
  phoneticTolerance?: number
  /** 需要排除的词（通常传入该词的词形变化，避免同一张卡片里重复出现） */
  exclude?: ReadonlySet<string>
}

/** 距离 2 以内的候选不够时，允许用距离 3 但相似度足够的候选补齐 */
const LOOSE_MIN_SCORE = 34
const LOOSE_MIN_LENGTH = 6

function phoneticOf(entry: DictEntry): string {
  return normalizePhonetic(entry.us ?? entry.uk)
}

interface Scored {
  entry: DictEntry
  distance: number
  score: number
  reason: ConfusableReason
}

function scoreCandidate(
  word: string,
  wordPhonetic: string,
  entry: DictEntry,
  tolerance: number,
  maxDistance: number
): Scored | null {
  const candidate = entry.w.toLowerCase()
  const distance = editDistance(word, candidate, maxDistance)
  if (distance > maxDistance || distance === 0) return null

  const prefix = commonPrefixLength(word, candidate)
  const suffix = commonSuffixLength(word, candidate)
  const sameLength = word.length === candidate.length
  const firstSame = word[0] === candidate[0]

  const candidatePhonetic = phoneticOf(entry)
  const phoneticDistance =
    wordPhonetic && candidatePhonetic ? editDistance(wordPhonetic, candidatePhonetic, tolerance + 1) : 99
  const soundsAlike = phoneticDistance <= tolerance

  // 释义完全相同说明是同一个意思的两种拼写，不算「易混」
  const a = cleanTrans(entry.t)
  if (!a) return null

  let score = 100 - distance * 26
  score += Math.min(prefix, 4) * 4
  score += Math.min(suffix, 4) * 3
  if (sameLength) score += 10
  if (firstSame) score += 5
  if (soundsAlike) score += 18
  if (distance === 1) score += 12

  const reason: ConfusableReason = soundsAlike && distance > 0 ? 'sound' : sameLength && prefix >= 2 ? 'shape' : 'tail'

  return { entry, distance, score, reason }
}

/**
 * 距离 3 的候选要额外过一道门槛，避免为了凑数把不相干的词塞进来：
 * 两个词都不能太短、分数要够，且首尾至少有一处明显重合
 * （abandon / abundant 的公共前缀只有 "ab"，所以前缀门槛放到 2）。
 */
function passesLooseGuard(word: string, candidate: string, score: number): boolean {
  if (word.length < LOOSE_MIN_LENGTH || candidate.length < LOOSE_MIN_LENGTH) return false
  if (score < LOOSE_MIN_SCORE) return false
  return commonPrefixLength(word, candidate) >= 2 || commonSuffixLength(word, candidate) >= 3
}

function toConfusable(item: Scored): ConfusableWord {
  return {
    word: item.entry.w,
    trans: item.entry.t,
    meaning: cleanTrans(item.entry.t),
    pos: posOfEntry(item.entry),
    distance: item.distance,
    score: item.score,
    reason: item.reason
  }
}

/**
 * 查找易混词。
 *
 * 先用编辑距离 ≤2 的候选；不够 limit 时再用距离 3 但相似度达标的候选补齐
 * （否则 abandon 会拿不到 abundant 这个经典易混词）。
 *
 * @param word 目标词
 * @param index 词库索引
 */
export function findConfusables(word: string, index: WordIndex, options: FindConfusablesOptions = {}): ConfusableWord[] {
  const limit = options.limit ?? 3
  const tolerance = options.phoneticTolerance ?? 1
  const exclude = options.exclude
  const lower = word.trim().toLowerCase()
  if (!lower || lower.includes(' ') || lower.length < 3) return []

  const headEntry = index.byWord.get(lower)
  const headMeaning = headEntry ? cleanTrans(headEntry.t) : ''
  const wordPhonetic = headEntry ? phoneticOf(headEntry) : ''

  const strict: Scored[] = []
  const loose: Scored[] = []
  const seenWords = new Set<string>()

  for (const entry of candidatesForConfusable(index, lower)) {
    if (entry.w.includes(' ')) continue
    const key = entry.w.toLowerCase()
    if (seenWords.has(key)) continue
    if (exclude?.has(key)) continue
    const candidateMeaning = cleanTrans(entry.t)
    if (!candidateMeaning) continue
    if (headMeaning && candidateMeaning === headMeaning) continue
    seenWords.add(key)

    const result = scoreCandidate(lower, wordPhonetic, entry, tolerance, 3)
    if (!result) continue
    if (result.distance <= 2) strict.push(result)
    else if (passesLooseGuard(lower, key, result.score)) loose.push(result)
  }

  const byScore = (a: Scored, b: Scored) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.distance !== b.distance) return a.distance - b.distance
    return a.entry.w.localeCompare(b.entry.w)
  }
  strict.sort(byScore)
  loose.sort(byScore)

  const picked = [...strict]
  if (picked.length < limit) picked.push(...loose.slice(0, limit - picked.length))

  return picked.slice(0, limit).map(toConfusable)
}
