import type { DictEntry } from './types'

/** 词性（只区分学习时最有用的四类） */
export type WordPos = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other'

export const POS_LABEL: Record<WordPos, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
  other: '其他'
}

/** 展示顺序：动词 → 名词 → 形容词 → 副词 → 其他 */
export const POS_ORDER: WordPos[] = ['verb', 'noun', 'adjective', 'adverb', 'other']

const POS_MAP: Record<string, WordPos> = {
  n: 'noun',
  v: 'verb',
  vt: 'verb',
  vi: 'verb',
  ving: 'verb',
  adj: 'adjective',
  a: 'adjective',
  adv: 'adverb',
  ad: 'adverb',
  prep: 'other',
  conj: 'other',
  pron: 'other',
  num: 'other',
  art: 'other',
  int: 'other',
  aux: 'other',
  abbr: 'other'
}

/** 释义开头的词性标记：`n. 决定` / `v. 决定` / `(adj.) xxx` */
const LEADING_POS_RE = /^\s*\(?\s*(n|v|vt|vi|adj|adv|ad|a|prep|conj|pron|num|art|int|aux|abbr)\s*\.\s*/i
/** 释义结尾括号里的词性标记：`决定性的；坚定的 (adj.)` */
const TRAILING_POS_RE = /\(\s*(n|v|vt|vi|adj|adv|ad|a)\s*\.?\s*\)\s*$/i

function toPos(token: string | undefined): WordPos | null {
  if (!token) return null
  return POS_MAP[token.toLowerCase()] ?? null
}

/**
 * 从词典释义里解析词性。
 * 内置词库里约 46% 的条目自带标记，且既有前置（`n. xxx`）也有后置（`xxx (n.)`）两种写法，
 * 所以两边都要看；先看前置，再看后置。
 */
export function parsePosFromTrans(trans: readonly string[]): WordPos | null {
  for (const line of trans) {
    const leading = line.match(LEADING_POS_RE)
    const pos = toPos(leading?.[1])
    if (pos) return pos
  }
  for (const line of trans) {
    const trailing = line.match(TRAILING_POS_RE)
    const pos = toPos(trailing?.[1])
    if (pos) return pos
  }
  return null
}

/** 词条自身在词典里登记的词性 */
export function posOfEntry(entry: DictEntry): WordPos | null {
  return parsePosFromTrans(entry.t)
}

/** 去掉释义里的词性标记，展示时更干净 */
export function stripPosMarker(line: string): string {
  return line.replace(LEADING_POS_RE, '').replace(TRAILING_POS_RE, '').trim()
}

/** 释义的标准展示文本（去掉词性标记后拼接） */
export function cleanTrans(trans: readonly string[]): string {
  return trans
    .map((line) => stripPosMarker(line))
    .filter(Boolean)
    .join('；')
}
