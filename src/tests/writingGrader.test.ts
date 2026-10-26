import { describe, expect, it } from 'vitest'
import { buildSpellDictionary, gradeEssay } from '../core/writingGrader'
import { getWritingPool } from '../data/writing'

const task = getWritingPool('cet4', 'drill')[0]

const DICT = buildSpellDictionary([
  'government',
  'environment',
  'receive',
  'library',
  'student',
  'because',
  'although',
  'important',
  'reading',
  'friends',
  'travel',
  'school'
])

function grade(text: string) {
  return gradeEssay(text, task, { dictionary: DICT })
}

describe('作文批改引擎', () => {
  it('查出常见拼写错误并给出建议', () => {
    const result = grade(
      'I think the goverment should build a new libary near our shcool because students need it.'
    )
    const spellings = result.issues.filter((issue) => issue.kind === 'spelling')
    expect(spellings.some((issue) => issue.message.includes('goverment'))).toBe(true)
    expect(spellings.find((issue) => issue.message.includes('goverment'))?.suggestion).toBe('government')
    expect(spellings.some((issue) => issue.message.includes('libary'))).toBe(true)
    // excerpt 是所在句子，方便在卡片里看上下文
    expect(spellings[0].excerpt).toMatch(/goverment/)
  })

  it('语法规则覆盖句首大写、人称代词、冠词与重复词', () => {
    const result = grade(
      'i think this is a important thing. He do not know the the answer. Although it is hard, but I like it.'
    )
    const messages = result.issues.map((issue) => issue.message).join(' / ')
    expect(messages).toContain('句首单词首字母没有大写')
    expect(messages).toContain('人称代词 I 必须大写')
    expect(messages).toContain('同一个词连续出现了两次')
    expect(messages).toContain('although')
  })

  it('a / an 与情态动词加 to 的规则', () => {
    const result = grade('She bought an book and said we can to go home an hour later.')
    const messages = result.issues.map((issue) => issue.message).join(' / ')
    expect(messages).toContain('辅音开头的词前面应该用 a')
    expect(messages).toContain('情态动词后面直接跟动词原形')
  })

  it('结构完整、篇幅达标的作文分数明显更高', () => {
    const weak = grade('I think reading is good.')
    const strong = grade(
      [
        'Reading has become a daily habit for many college students, and it is worth thinking about why.',
        'In my opinion, reading works in two ways. First, it trains patience: a long article cannot be finished in one minute, so the mind learns to follow an argument. Second, it widens vocabulary naturally, because words appear in context rather than in a list.',
        'What is more, reading at night helps me fall asleep without a phone. Therefore I keep thirty minutes for a book every evening.'
      ].join('\n\n')
    )
    expect(strong.score).toBeGreaterThan(weak.score)
    expect(strong.breakdown.structure).toBeGreaterThan(weak.breakdown.structure)
    expect(strong.band).not.toBe('待提高')
  })

  it('统计词数、句数与段落数', () => {
    const result = grade('First paragraph is here.\n\nSecond paragraph is longer and has more words in it.')
    expect(result.stats.paragraphs).toBe(2)
    expect(result.stats.sentences).toBe(2)
    expect(result.stats.words).toBeGreaterThan(8)
    expect(result.comments.length).toBeGreaterThan(0)
    expect(result.cetScore).toBeGreaterThan(0)
  })

  it('空作文不会崩，分数为下限', () => {
    const result = grade('')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.stats.words).toBe(0)
    expect(result.band).toBe('待提高')
  })
})
