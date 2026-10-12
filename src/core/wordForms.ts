import type { DictEntry } from './types'
import { POS_ORDER, cleanTrans, posOfEntry, type WordPos } from './pos'
import { candidatesForFamily, type WordIndex } from './wordIndex'
import { editDistance } from './textSimilarity'

/**
 * 词形变化：名词、形容词、副词等其它形式。
 *
 * 采用「规则推导 + 词库验证」两条腿：
 *   1. 用英语构词规则从词头生成候选（含词干改写：去 e、y→i、双写辅音）
 *   2. 只在**词库里真实存在**的词条上落地——绝不凭空造词
 * 因此展示出来的每个形式都带着词典里真实的中文释义。
 *
 * 精度靠三道守卫：
 *   - 屈折规则与部分派生规则按词性收窄（否则 care + 比较级 -er 会拼出 career）
 *   - 拿不准词性时禁用容易"巧合撞词"的短后缀
 *   - 同族词补充要排除「更属于另一个词」的候选（happening 属于 happen，不属于 happy）
 */

export type FormRelation = 'inflection' | 'derived'

export interface WordForm {
  word: string
  trans: string[]
  /** 干净释义（去掉词性标记） */
  meaning: string
  pos: WordPos
  relation: FormRelation
  /** 命中的构词规则，例如 '-ness'；同族补充为「同族」 */
  via: string
}

export interface BuildWordFormsOptions {
  /** 最多返回几个形式，默认 8 */
  limit?: number
  /** 是否额外用「同前缀 + 后缀」的方式补充规则覆盖不到的同族词（如 decide → decisive） */
  includeFamily?: boolean
}

interface SuffixRule {
  suffix: string
  pos: WordPos
  kind: FormRelation
  /** 追加后缀前的词干处理 */
  adjusts: Array<'none' | 'drop-e' | 'y-to-i' | 'double'>
  /** 只对哪些词性的词头生效 */
  appliesTo?: WordPos[]
}

function rule(
  suffix: string,
  pos: WordPos,
  kind: FormRelation,
  adjusts: SuffixRule['adjusts'] = ['none'],
  appliesTo?: WordPos[]
): SuffixRule {
  return { suffix, pos, kind, adjusts, appliesTo }
}

/** 屈折变化：同一个词的不同语法形式 */
const INFLECTION_RULES: SuffixRule[] = [
  rule('s', 'other', 'inflection', ['none', 'y-to-i'], ['noun', 'verb', 'other']),
  rule('es', 'other', 'inflection', ['none'], ['noun', 'verb', 'other']),
  rule('ed', 'other', 'inflection', ['none', 'drop-e', 'y-to-i', 'double'], ['verb']),
  rule('ing', 'other', 'inflection', ['none', 'drop-e', 'double'], ['verb', 'noun']),
  rule('er', 'other', 'inflection', ['none', 'drop-e', 'y-to-i', 'double'], ['adjective', 'adverb']),
  rule('est', 'other', 'inflection', ['none', 'drop-e', 'y-to-i', 'double'], ['adjective', 'adverb'])
]

/** 词性未知时只允许最安全的屈折规则 */
const SAFE_INFLECTIONS = new Set(['s', 'es', 'ed', 'ing'])

const NOUN: WordPos[] = ['noun']
const VERB: WordPos[] = ['verb']
const ADJ: WordPos[] = ['adjective']
const NOUN_VERB: WordPos[] = ['noun', 'verb']
const ADJ_NOUN: WordPos[] = ['adjective', 'noun']

/** 派生：变成另一个词性。appliesTo 用于按词性收窄，减少偶然撞词 */
const DERIVATION_RULES: SuffixRule[] = [
  // 名词
  rule('ness', 'noun', 'derived', ['none', 'y-to-i'], ADJ),
  rule('ment', 'noun', 'derived', ['none', 'drop-e'], VERB),
  rule('ion', 'noun', 'derived', ['drop-e'], VERB),
  rule('tion', 'noun', 'derived', ['none', 'drop-e'], VERB),
  rule('tivity', 'noun', 'derived', ['none', 'drop-e'], VERB),
  rule('ivity', 'noun', 'derived', ['none', 'drop-e'], ADJ),
  rule('sion', 'noun', 'derived', ['none', 'drop-e'], VERB),
  rule('ation', 'noun', 'derived', ['none', 'drop-e'], VERB),
  rule('ity', 'noun', 'derived', ['none', 'drop-e'], ADJ),
  rule('ance', 'noun', 'derived', ['none', 'drop-e'], NOUN_VERB),
  rule('ence', 'noun', 'derived', ['none', 'drop-e'], NOUN_VERB),
  rule('ist', 'noun', 'derived', ['none', 'drop-e'], NOUN),
  rule('ism', 'noun', 'derived', ['none', 'drop-e'], NOUN),
  rule('ship', 'noun', 'derived', ['none'], NOUN),
  rule('hood', 'noun', 'derived', ['none'], NOUN),
  rule('dom', 'noun', 'derived', ['none'], NOUN),
  rule('age', 'noun', 'derived', ['none', 'drop-e'], NOUN, ),
  rule('er', 'noun', 'derived', ['none', 'drop-e', 'double'], VERB),
  rule('or', 'noun', 'derived', ['none', 'drop-e'], VERB),
  // 形容词
  rule('able', 'adjective', 'derived', ['none', 'drop-e', 'y-to-i'], VERB),
  rule('ible', 'adjective', 'derived', ['none', 'drop-e'], VERB),
  rule('ive', 'adjective', 'derived', ['none', 'drop-e'], NOUN_VERB),
  rule('tive', 'adjective', 'derived', ['none'], VERB),
  rule('ous', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('ful', 'adjective', 'derived', ['none', 'y-to-i'], NOUN_VERB),
  rule('less', 'adjective', 'derived', ['none', 'y-to-i'], NOUN_VERB),
  rule('ial', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('cial', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('icial', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('sive', 'adjective', 'derived', ['none', 'drop-e'], VERB),
  rule('ical', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('al', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('ic', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('ish', 'adjective', 'derived', ['none', 'y-to-i'], ADJ_NOUN),
  rule('ary', 'adjective', 'derived', ['none', 'drop-e'], NOUN),
  rule('ant', 'adjective', 'derived', ['none', 'drop-e'], VERB),
  rule('ent', 'adjective', 'derived', ['none', 'drop-e'], VERB),
  rule('y', 'adjective', 'derived', ['none'], NOUN),
  // 副词（-fully / -lessly 不限制词性：复合后缀很难和别的词撞车，交给词库验证）
  rule('ly', 'adverb', 'derived', ['none', 'y-to-i'], ADJ),
  rule('ally', 'adverb', 'derived', ['none', 'drop-e'], ADJ),
  rule('fully', 'adverb', 'derived', ['none']),
  rule('lessly', 'adverb', 'derived', ['none', 'y-to-i']),
  rule('ently', 'adverb', 'derived', ['none'], ADJ),
  rule('antly', 'adverb', 'derived', ['none'], ADJ),
  rule('ably', 'adverb', 'derived', ['none'], ADJ),
  rule('ibly', 'adverb', 'derived', ['none'], ADJ),
  rule('ward', 'adverb', 'derived', ['none'], NOUN_VERB),
  // 动词
  rule('ize', 'verb', 'derived', ['none', 'drop-e'], ADJ_NOUN),
  rule('ise', 'verb', 'derived', ['none', 'drop-e'], ADJ_NOUN),
  rule('ify', 'verb', 'derived', ['none', 'y-to-i'], ADJ_NOUN),
  rule('en', 'verb', 'derived', ['none'], ADJ),
  rule('ate', 'verb', 'derived', ['none', 'drop-e'], ADJ_NOUN)
]

/** 词性未知时禁用这些短后缀：它们最容易与别的词"巧合撞车" */
const RISKY_WITHOUT_POS = new Set(['er', 'or', 'y', 'en', 'age', 'ate', 'ist', 'ism', 'al', 'ic', 'ant', 'ent'])

const ALL_RULES = [...INFLECTION_RULES, ...DERIVATION_RULES]

/** 可用于反推词干的后缀（长后缀优先，避免 -ation 被 -ion 抢先） */
const STRIPPABLE_SUFFIXES = [...new Set(ALL_RULES.map((item) => item.suffix))]
  .filter((suffix) => suffix.length >= 2)
  .sort((a, b) => b.length - a.length)

const VOWELS = 'aeiou'

function isVowel(char: string | undefined): boolean {
  return !!char && VOWELS.includes(char)
}

/** 按规则生成候选拼写；同一规则可能因拼写规则产生多个候选，全部交给词库验证 */
function applyRule(base: string, item: SuffixRule): string[] {
  const out: string[] = []
  for (const adjust of item.adjusts) {
    let stem = base
    if (adjust === 'drop-e' && stem.endsWith('e')) stem = stem.slice(0, -1)
    if (adjust === 'y-to-i' && stem.endsWith('y')) stem = `${stem.slice(0, -1)}i`
    if (adjust === 'double') {
      const last = stem[stem.length - 1]
      const prev = stem[stem.length - 2]
      const prev2 = stem[stem.length - 3]
      if (last && prev && prev2 && !isVowel(last) && isVowel(prev) && !isVowel(prev2) && !'wxy'.includes(last)) {
        stem = `${stem}${last}`
      }
    }
    out.push(`${stem}${item.suffix}`)
  }
  return [...new Set(out)]
}

/** 可能的词干：本体 + 拼写还原 + 去掉已知后缀后的还原 */
export function stemVariants(word: string): string[] {
  const out = new Set<string>([word])

  if (word.endsWith('e')) out.add(word.slice(0, -1))
  // y 结尾只做 y→i 还原；不要直接删掉 y，否则 happy 会派生出 happen
  if (word.endsWith('y')) out.add(`${word.slice(0, -1)}i`)

  for (const suffix of STRIPPABLE_SUFFIXES) {
    if (!word.endsWith(suffix)) continue
    if (word.length - suffix.length < 3) continue
    const base = word.slice(0, -suffix.length)
    out.add(base)
    out.add(`${base}e`) // caring → car → care
    if (base.endsWith('i')) out.add(`${base.slice(0, -1)}y`) // happi → happy
    const last = base[base.length - 1]
    if (last && base[base.length - 2] === last) out.add(base.slice(0, -1)) // runn → run
  }

  return [...out].filter((stem) => stem.length >= 3)
}

/**
 * 与词头共享前缀、且尾部正好是已知后缀的「同族词」。
 * 构词规则覆盖不到的形态（decide → decisive / decision）靠这里补齐。
 */
export function isFamilyCandidate(word: string, candidate: string): boolean {
  if (candidate.includes(' ') || word.includes(' ')) return false
  if (candidate === word) return false
  if (Math.abs(candidate.length - word.length) > 6) return false

  let common = 0
  while (common < word.length && common < candidate.length && word[common] === candidate[common]) common += 1
  if (common < 4) return false
  // 两个都很短时要求更长的公共前缀，避免 happy / happen 这类巧合
  if (word.length <= 7 && candidate.length <= 7 && common < 5) return false

  const tailWord = word.slice(common)
  const tailCandidate = candidate.slice(common)
  if (tailWord.length > 3) return false
  return STRIPPABLE_SUFFIXES.includes(tailCandidate)
}

/** 候选词是不是「更属于另一个词」（happening 更属于 happen，而不是 happy） */
function claimedByCloserWord(candidate: string, headword: string, index: WordIndex): boolean {
  for (const suffix of STRIPPABLE_SUFFIXES) {
    if (!candidate.endsWith(suffix)) continue
    const stem = candidate.slice(0, -suffix.length)
    if (stem.length < 3) continue
    const alternatives = [stem, `${stem}e`]
    if (stem.endsWith('i')) alternatives.push(`${stem.slice(0, -1)}y`)
    for (const alternative of alternatives) {
      if (alternative === headword || alternative === candidate) continue
      if (!index.byWord.has(alternative)) continue
      if (editDistance(alternative, candidate, 3) < editDistance(headword, candidate, 4)) return true
    }
  }
  return false
}

/**
 * 计算词形变化。
 * @param word 词头
 * @param index 词库索引（只返回词库里真实存在的形式）
 */
export function buildWordForms(word: string, index: WordIndex, options: BuildWordFormsOptions = {}): WordForm[] {
  const limit = options.limit ?? 8
  const lower = word.trim().toLowerCase()
  if (!lower || lower.includes(' ') || lower.length < 3) return []

  const headEntry = index.byWord.get(lower)
  const headPos = headEntry ? posOfEntry(headEntry) : null
  const headMeaning = headEntry ? cleanTrans(headEntry.t) : ''

  const picked = new Map<string, { rule: SuffixRule | null; relation: FormRelation }>()

  const consider = (form: string, ruleItem: SuffixRule | null, relation: FormRelation) => {
    if (form === lower || form.includes(' ') || form.length < 3) return
    if (picked.has(form)) return
    if (!index.byWord.has(form)) return
    picked.set(form, { rule: ruleItem, relation })
  }

  // 1) 屈折：只从词头本体派生，并按词性收窄规则（care 是动词，不该有比较级 career）
  for (const item of INFLECTION_RULES) {
    if (headPos) {
      if (item.appliesTo && !item.appliesTo.includes(headPos)) continue
    } else if (!SAFE_INFLECTIONS.has(item.suffix)) {
      continue
    }
    for (const form of applyRule(lower, item)) consider(form, item, 'inflection')
  }

  // 2) 派生：词头本体与各拼写还原后的词干都可以加后缀
  for (const stem of stemVariants(lower)) {
    for (const item of DERIVATION_RULES) {
      if (headPos) {
        if (item.appliesTo && !item.appliesTo.includes(headPos)) continue
      } else if (RISKY_WITHOUT_POS.has(item.suffix)) {
        continue
      }
      for (const form of applyRule(stem, item)) consider(form, item, 'derived')
    }
  }

  // 3) 同族词补充
  if (options.includeFamily !== false) {
    for (const entry of candidatesForFamily(index, lower)) {
      const candidate = entry.w.toLowerCase()
      if (!isFamilyCandidate(lower, candidate)) continue
      if (claimedByCloserWord(candidate, lower, index)) continue
      consider(candidate, null, 'derived')
    }
  }

  const forms: WordForm[] = []
  for (const [form, info] of picked) {
    const entry = index.byWord.get(form) as DictEntry
    const meaning = cleanTrans(entry.t)
    // 释义与词头相同、且只差一个字母的多半是异体拼写（grey / gray），学习价值低。
    // 不能只比释义：produce 与 production 的释义本来就一样，那是正常的派生关系。
    if (meaning && meaning === headMeaning && editDistance(lower, form, 2) <= 1) continue

    const entryPos = posOfEntry(entry)
    const pos: WordPos =
      entryPos ?? (info.relation === 'inflection' ? (headPos ?? info.rule?.pos ?? 'other') : (info.rule?.pos ?? 'other'))

    forms.push({
      word: entry.w,
      trans: entry.t,
      meaning,
      pos,
      relation: info.relation,
      via: info.rule ? `-${info.rule.suffix}` : '同族'
    })
  }

  forms.sort((a, b) => {
    const posDiff = POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos)
    if (posDiff !== 0) return posDiff
    if (a.relation !== b.relation) return a.relation === 'inflection' ? -1 : 1
    if (a.word.length !== b.word.length) return a.word.length - b.word.length
    return a.word.localeCompare(b.word)
  })

  return forms.slice(0, limit)
}
