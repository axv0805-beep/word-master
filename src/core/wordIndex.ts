import type { DictEntry } from './types'

/**
 * 词库索引：把「易混词」与「词形变化」需要的查找结构一次性建好。
 * 词典规模在 1 万词条量级，建索引与查询都很轻。
 */
export interface WordIndex {
  entries: readonly DictEntry[]
  /** 小写单词 → 词条 */
  byWord: Map<string, DictEntry>
  /** 小写前 4 个字母 → 同前缀词条（用于找同族词，避免全量扫描） */
  byPrefix: Map<string, DictEntry[]>
  /** 首字母相同且长度接近的词条（用于找易混词） */
  buckets: Map<string, DictEntry[]>
}

export const PREFIX_LENGTH = 4

function prefixKey(word: string): string {
  return word.slice(0, PREFIX_LENGTH)
}

/**
 * 易混词候选分桶：只按「长度」分。
 * 不能按首字母分——effect / affect 正是首字母不同才最容易混。
 */
function bucketKey(word: string, length = word.length): string {
  return `${length}`
}

export function buildWordIndex(entries: readonly DictEntry[]): WordIndex {
  const byWord = new Map<string, DictEntry>()
  const byPrefix = new Map<string, DictEntry[]>()
  const buckets = new Map<string, DictEntry[]>()

  for (const entry of entries) {
    const lower = entry.w.toLowerCase()
    if (!byWord.has(lower)) byWord.set(lower, entry)

    const prefix = prefixKey(lower)
    const prefixList = byPrefix.get(prefix)
    if (prefixList) prefixList.push(entry)
    else byPrefix.set(prefix, [entry])

    // 同一个词条会进入 5 个长度桶，便于「长度 ±2」的快速取候选
    for (let length = lower.length - 2; length <= lower.length + 2; length += 1) {
      const key = bucketKey(lower, length)
      const list = buckets.get(key)
      if (list) list.push(entry)
      else buckets.set(key, [entry])
    }
  }

  return { entries, byWord, byPrefix, buckets }
}

/** 取「长度接近、首字母相同」的候选（易混词的粗筛） */
export function candidatesForConfusable(index: WordIndex, word: string): DictEntry[] {
  const lower = word.toLowerCase()
  const out: DictEntry[] = []
  const seen = new Set<string>()
  for (let length = lower.length - 2; length <= lower.length + 2; length += 1) {
    const list = index.buckets.get(bucketKey(lower, length))
    if (!list) continue
    for (const entry of list) {
      const key = entry.w.toLowerCase()
      if (key === lower || seen.has(key)) continue
      seen.add(key)
      out.push(entry)
    }
  }
  return out
}

/** 取「前 4 个字母相同」的同族候选 */
export function candidatesForFamily(index: WordIndex, word: string): DictEntry[] {
  const lower = word.toLowerCase()
  const out: DictEntry[] = []
  const seen = new Set<string>()
  const prefixes = new Set<string>([prefixKey(lower)])
  // 词干改写可能让前 4 个字母就出现差异（happy → happi），补上几个近似前缀
  if (lower.length > PREFIX_LENGTH) {
    prefixes.add(prefixKey(lower.slice(0, -1)))
    prefixes.add(prefixKey(lower.slice(0, -1) + 'i'))
  }
  for (const prefix of prefixes) {
    const list = index.byPrefix.get(prefix)
    if (!list) continue
    for (const entry of list) {
      const key = entry.w.toLowerCase()
      if (key === lower || seen.has(key)) continue
      seen.add(key)
      out.push(entry)
    }
  }
  return out
}
