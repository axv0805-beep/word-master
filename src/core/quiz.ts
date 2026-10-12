import type { DictEntry, Question, QuestionType } from './types'
import { randInt, shuffle, type Rng } from './rng'

/** 释义的标准展示文本（多义项用中文分号连接） */
export function canonicalTrans(entry: DictEntry): string {
  return entry.t.join('；')
}

/** 选项文本：zh2en 用英文单词，其余题型用中文释义 */
export function optionTextFor(type: QuestionType, entry: DictEntry): string {
  return type === 'zh2en' ? entry.w : canonicalTrans(entry)
}

/**
 * 优先选择与目标词"形近/义异"的词做干扰项：
 * 同一首字母、词长接近的词更有迷惑性，但必须保证释义不同。
 */
function distractorScore(entry: DictEntry, target: DictEntry): number {
  let score = 0
  if (entry.w[0]?.toLowerCase() === target.w[0]?.toLowerCase()) score += 3
  const diff = Math.abs(entry.w.length - target.w.length)
  score += Math.max(0, 3 - diff)
  if (entry.t.length === target.t.length) score += 1
  return score
}

/**
 * 抽取干扰项，保证：
 *   1. 不含正确答案本身；
 *   2. 选项文本互不相同（含正确答案），避免出现两个一样的选项；
 *   3. 不足时回退到全词书，仍不足则返回可用的全部（调用方需确保词书够大）。
 */
export function pickDistractors(
  rng: Rng,
  pool: readonly DictEntry[],
  target: DictEntry,
  type: QuestionType,
  count = 3
): DictEntry[] {
  const answerText = optionTextFor(type, target)
  const seen = new Set<string>([answerText])

  const candidates: DictEntry[] = []
  for (const entry of pool) {
    if (entry.w === target.w) continue
    const text = optionTextFor(type, entry)
    if (!text || seen.has(text)) continue
    seen.add(text)
    candidates.push(entry)
  }

  candidates.sort((a, b) => distractorScore(b, target) - distractorScore(a, target))
  // 从最像的前若干候选中随机取，既保证迷惑性又保证每轮题目不同
  const shortlist = candidates.slice(0, Math.max(count * 10, 30))

  const picked: DictEntry[] = []
  const used = new Set<string>([answerText])
  for (const entry of shuffle(rng, shortlist)) {
    const text = optionTextFor(type, entry)
    if (used.has(text)) continue
    used.add(text)
    picked.push(entry)
    if (picked.length === count) break
  }

  if (picked.length < count) {
    for (const entry of shuffle(rng, candidates)) {
      const text = optionTextFor(type, entry)
      if (used.has(text)) continue
      used.add(text)
      picked.push(entry)
      if (picked.length === count) break
    }
  }

  return picked
}

export interface BuildQuestionOptions {
  entry: DictEntry
  pool: readonly DictEntry[]
  type: QuestionType
  rng: Rng
  index: number
  replay?: boolean
  /** 选项数量，默认 4（4 选 1） */
  optionCount?: number
}

/** 生成一道题 */
export function buildQuestion(options: BuildQuestionOptions): Question {
  const { entry, pool, type, rng, index, replay = false } = options
  const optionCount = options.optionCount ?? 4
  const answer = optionTextFor(type, entry)

  if (type === 'spelling') {
    return {
      id: `q${index}-spelling-${entry.w}`,
      type,
      entry,
      prompt: canonicalTrans(entry),
      answer: entry.w,
      replay
    }
  }

  const distractors = pickDistractors(rng, pool, entry, type, optionCount - 1)
  const optionsList = shuffle(rng, [answer, ...distractors.map((d) => optionTextFor(type, d))])

  const prompt = type === 'zh2en' ? canonicalTrans(entry) : entry.w

  return {
    id: `q${index}-${type}-${entry.w}`,
    type,
    entry,
    prompt,
    options: optionsList,
    answer,
    replay
  }
}

/** 规范化拼写输入：忽略大小写、首尾空白与多余空格、结尾标点 */
export function normalizeSpellingInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/g, '')
}

/** 判断作答是否正确 */
export function isCorrectAnswer(question: Question, input: string): boolean {
  if (question.type === 'spelling') {
    return normalizeSpellingInput(input) === normalizeSpellingInput(question.answer)
  }
  return input === question.answer
}

/** 为一轮练习挑选单选题型的题目数量统计（用于 UI 展示，不做实际出题） */
export function optionCountOf(question: Question): number {
  return question.options?.length ?? 0
}

/** 随机取一个题型（按给定权重顺序纯随机） */
export function pickQuestionType(rng: Rng, types: readonly QuestionType[]): QuestionType {
  if (types.length === 0) return 'zh2en'
  return types[randInt(rng, types.length)]
}
