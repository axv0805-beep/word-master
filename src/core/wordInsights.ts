import type { WordForm } from './wordForms'
import type { ConfusableWord } from './confusables'
import { buildWordForms } from './wordForms'
import { findConfusables } from './confusables'
import { POS_LABEL, POS_ORDER, type WordPos } from './pos'
import type { WordIndex } from './wordIndex'

export interface WordFormGroup {
  pos: WordPos
  label: string
  items: WordForm[]
}

export interface WordInsightsResult {
  forms: WordForm[]
  /** 词形按词性分组（动词 → 名词 → 形容词 → 副词） */
  formGroups: WordFormGroup[]
  confusables: ConfusableWord[]
}

const MAX_CACHE = 400
let cache = new Map<string, WordInsightsResult>()
let cacheIndex: WordIndex | null = null

function groupForms(forms: WordForm[]): WordFormGroup[] {
  const groups: WordFormGroup[] = []
  for (const pos of POS_ORDER) {
    const items = forms.filter((item) => item.pos === pos)
    if (items.length > 0) groups.push({ pos, label: POS_LABEL[pos], items })
  }
  return groups
}

/**
 * 分析一个词的「词形变化 + 易混词」。
 * 结果按词缓存；换语料库（例如导入了自定义词书）时整体失效。
 */
export function analyzeWord(word: string, index: WordIndex): WordInsightsResult {
  if (cacheIndex !== index) {
    cache = new Map()
    cacheIndex = index
  }

  const key = word.trim().toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const forms = buildWordForms(key, index)
  // 词形变化已经展示过的词，不再在易混词里重复出现
  const exclude = new Set(forms.map((item) => item.word.toLowerCase()))
  const confusables = findConfusables(key, index, { exclude })

  const result: WordInsightsResult = { forms, formGroups: groupForms(forms), confusables }

  if (cache.size >= MAX_CACHE) {
    // 简单的容量控制：丢掉最早插入的一批
    const keys = [...cache.keys()].slice(0, Math.floor(MAX_CACHE / 2))
    for (const old of keys) cache.delete(old)
  }
  cache.set(key, result)
  return result
}

export function clearWordInsightsCache(): void {
  cache = new Map()
  cacheIndex = null
}
