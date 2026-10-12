/** 文本相似度工具：易混词与词形变化共用 */

/** 编辑距离（带提前退出上限） */
export function editDistance(a: string, b: string, max = 3): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1

  let prev = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const value = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      cur[j] = value
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/**
 * 归一化音标：去掉重音、长音、连字符等符号，只保留音素字母。
 *
 * 注意两点：
 *   1. 不能用 [^a-z]——IPA 字母（ɪ / ɛ / ə / ʃ …）不是 ASCII
 *   2. 也不能只用 \p{L}——重音符 ˈ 与长音符 ː 属于「修饰字母」，会被当成字母保留
 */
export function normalizePhonetic(phonetic: string | undefined): string {
  if (!phonetic) return ''
  return phonetic
    .toLowerCase()
    .replace(/[\u02C8\u02CC\u02D0\u02D1\u02E0-\u02FF\u0300-\u036F\u2018\u2019'’]/g, '')
    .replace(/[^\p{L}]/gu, '')
}

export function commonPrefixLength(a: string, b: string): number {
  let count = 0
  while (count < a.length && count < b.length && a[count] === b[count]) count += 1
  return count
}

export function commonSuffixLength(a: string, b: string): number {
  let count = 0
  while (count < a.length && count < b.length && a[a.length - 1 - count] === b[b.length - 1 - count]) count += 1
  return count
}
