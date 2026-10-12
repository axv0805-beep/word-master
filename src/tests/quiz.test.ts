import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { DictEntry, QuestionType } from '../core/types'
import { buildQuestion, canonicalTrans, isCorrectAnswer, normalizeSpellingInput, pickDistractors } from '../core/quiz'
import { createRng } from '../core/rng'

/** 构造一个足够大的合成词池 */
function syntheticPool(size = 120): DictEntry[] {
  const words: DictEntry[] = []
  for (let i = 0; i < size; i += 1) {
    const letter = String.fromCharCode(97 + (i % 26))
    words.push({
      w: `${letter}word${i}`,
      t: [`释义-${i}`],
      us: `phonetic-${i}`,
      uk: `phonetic-${i}`
    })
  }
  return words
}

const ALL_TYPES: QuestionType[] = ['zh2en', 'en2zh', 'listening', 'spelling']

describe('quiz 出题引擎', () => {
  it('选项类题目始终给出 4 个互不相同的选项，且包含正确答案', () => {
    const pool = syntheticPool()
    for (const type of ['zh2en', 'en2zh', 'listening'] as QuestionType[]) {
      for (let i = 0; i < 200; i += 1) {
        const rng = createRng(1000 + i)
        const question = buildQuestion({ entry: pool[i % pool.length], pool, type, rng, index: i })
        expect(question.options).toBeDefined()
        const options = question.options ?? []
        expect(options).toHaveLength(4)
        expect(new Set(options).size).toBe(4)
        expect(options).toContain(question.answer)
      }
    }
  })

  it('拼写题不给选项，答案是单词本身，题干是中文释义', () => {
    const pool = syntheticPool()
    const question = buildQuestion({ entry: pool[3], pool, type: 'spelling', rng: createRng(7), index: 0 })
    expect(question.options).toBeUndefined()
    expect(question.answer).toBe(pool[3].w)
    expect(question.prompt).toBe(canonicalTrans(pool[3]))
  })

  it('干扰项不会与正确答案释义相同（避免同一题出现两个正确选项）', () => {
    const pool: DictEntry[] = [
      { w: 'alpha', t: ['第一'] },
      { w: 'beta', t: ['第一'] }, // 与 alpha 释义相同，不可作为 alpha 的干扰项
      { w: 'gamma', t: ['第三'] },
      { w: 'delta', t: ['第四'] },
      { w: 'epsilon', t: ['第五'] }
    ]
    const picked = pickDistractors(createRng(1), pool, pool[0], 'en2zh', 3)
    expect(picked.map((entry) => entry.w)).not.toContain('beta')
  })

  it('同一 seed 产生同一道题（可复现）', () => {
    const pool = syntheticPool()
    const a = buildQuestion({ entry: pool[0], pool, type: 'zh2en', rng: createRng(42), index: 0 })
    const b = buildQuestion({ entry: pool[0], pool, type: 'zh2en', rng: createRng(42), index: 0 })
    expect(a.options).toEqual(b.options)
  })

  it('拼写判定忽略大小写、首尾空格与结尾标点', () => {
    expect(normalizeSpellingInput('  Abandon. ')).toBe('abandon')
    const question = buildQuestion({
      entry: { w: 'abandon', t: ['放弃'] },
      pool: syntheticPool(),
      type: 'spelling',
      rng: createRng(3),
      index: 0
    })
    expect(isCorrectAnswer(question, 'ABANDON')).toBe(true)
    expect(isCorrectAnswer(question, 'abandon ')).toBe(true)
    expect(isCorrectAnswer(question, 'abandons')).toBe(false)
  })

  it('多词条目（短语）也能拼写判定', () => {
    const question = buildQuestion({
      entry: { w: 'mobile phone', t: ['手机'] },
      pool: syntheticPool(),
      type: 'spelling',
      rng: createRng(5),
      index: 0
    })
    expect(isCorrectAnswer(question, 'Mobile  Phone')).toBe(true)
    expect(isCorrectAnswer(question, 'mobile')).toBe(false)
  })

  it('用真实四级词书跑 3000 题不出现异常选项', () => {
    const file = path.resolve(__dirname, '../../public/dicts/cet4.json')
    if (!fs.existsSync(file)) {
      throw new Error('缺少 public/dicts/cet4.json，请先执行 pnpm fetch-dicts')
    }
    const pool = JSON.parse(fs.readFileSync(file, 'utf8')) as DictEntry[]
    expect(pool.length).toBeGreaterThan(2000)

    for (let i = 0; i < 3000; i += 1) {
      const rng = createRng(i + 1)
      const type = ALL_TYPES[i % ALL_TYPES.length]
      const entry = pool[i % pool.length]
      const question = buildQuestion({ entry, pool, type, rng, index: i })

      expect(question.answer.length).toBeGreaterThan(0)
      if (type === 'spelling') {
        expect(isCorrectAnswer(question, question.answer)).toBe(true)
      } else {
        const options = question.options ?? []
        expect(options).toHaveLength(4)
        expect(new Set(options).size).toBe(4)
        expect(options).toContain(question.answer)
        expect(isCorrectAnswer(question, question.answer)).toBe(true)
      }
    }
  })
})
