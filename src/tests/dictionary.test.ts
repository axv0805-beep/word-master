import { describe, expect, it } from 'vitest'
import type { DictEntry } from '../core/types'
import {
  ALPHABET,
  alphaOrder,
  availableLetters,
  hasEnoughForChoice,
  letterCounts,
  planRound,
  preferSpellable,
  startIndexForLetter,
  takeFrom
} from '../core/dictionary'
import { createRng, shuffle } from '../core/rng'

const sample: DictEntry[] = [
  { w: 'banana', t: ['香蕉'] },
  { w: 'Apple', t: ['苹果'] },
  { w: 'cherry', t: ['樱桃'] },
  { w: 'apricot', t: ['杏'] },
  { w: 'blueberry', t: ['蓝莓'] },
  { w: 'mobile phone', t: ['手机'] },
  { w: 'ice cream', t: ['冰淇淋'] },
  { w: 'date', t: ['枣'] },
  { w: 'elderberry', t: ['接骨木果'] },
  { w: 'fig', t: ['无花果'] }
]

describe('dictionary 词书工具', () => {
  it('按字母顺序排序且大小写不敏感', () => {
    const ordered = alphaOrder(sample)
    expect(ordered.map((entry) => entry.w)).toEqual([
      'Apple',
      'apricot',
      'banana',
      'blueberry',
      'cherry',
      'date',
      'elderberry',
      'fig',
      'ice cream',
      'mobile phone'
    ])
  })

  it('统计每个首字母的词量', () => {
    const counts = letterCounts(sample)
    expect(counts.A).toBe(2)
    expect(counts.B).toBe(2)
    expect(counts.C).toBe(1)
    expect(counts.F).toBe(1)
  })

  it('返回实际存在的首字母，且保持 A–Z 顺序', () => {
    const letters = availableLetters(sample)
    expect(letters).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'I', 'M'])
    expect(ALPHABET).toHaveLength(26)
  })

  it('可以定位任意首字母的起始下标', () => {
    const ordered = alphaOrder(sample)
    expect(ordered[startIndexForLetter(ordered, 'c')].w).toBe('cherry')
    expect(ordered[startIndexForLetter(ordered, 'B')].w).toBe('banana')
    // 不存在的首字母回退到 0
    expect(startIndexForLetter(ordered, 'Z')).toBe(0)
  })

  it('取题到头后循环，保证凑满一轮', () => {
    const ordered = alphaOrder(sample)
    const taken = takeFrom(ordered, ordered.length - 2, 5)
    expect(taken).toHaveLength(5)
    expect(taken[0].w).toBe('ice cream')
    expect(taken[2].w).toBe('Apple')
  })

  it('拼写题优先选单词语条', () => {
    const spellable = preferSpellable(sample)
    expect(spellable.every((entry) => !entry.w.includes(' '))).toBe(true)
  })

  it('选项题需要至少 4 个释义互不相同的词条', () => {
    expect(hasEnoughForChoice(sample)).toBe(true)
    expect(hasEnoughForChoice([{ w: 'a', t: ['一'] }, { w: 'b', t: ['一'] }])).toBe(false)
  })
})

describe('planRound 组卷', () => {
  it('alpha 模式从游标处按顺序取题并推进游标', () => {
    const ordered = alphaOrder(sample)
    const rng = createRng(1)
    const plan = planRound({
      mode: 'alpha',
      ordered,
      cursor: 2,
      size: 3,
      shuffle: <T,>(list: readonly T[]) => shuffle(rng, list)
    })
    expect(plan.words.map((entry) => entry.w)).toEqual(['banana', 'blueberry', 'cherry'])
    expect(plan.nextCursor).toBe(5)
  })

  it('alpha 模式从指定首字母开始', () => {
    const ordered = alphaOrder(sample)
    const rng = createRng(1)
    const plan = planRound({
      mode: 'alpha',
      ordered,
      cursor: startIndexForLetter(ordered, 'D'),
      size: 2,
      shuffle: <T,>(list: readonly T[]) => shuffle(rng, list)
    })
    expect(plan.words.map((entry) => entry.w)).toEqual(['date', 'elderberry'])
  })

  it('random 模式抽取指定数量且不重复，游标不变', () => {
    const ordered = alphaOrder(sample)
    const rng = createRng(5)
    const plan = planRound({
      mode: 'random',
      ordered,
      cursor: 0,
      size: 4,
      shuffle: <T,>(list: readonly T[]) => shuffle(rng, list)
    })
    expect(plan.words).toHaveLength(4)
    expect(new Set(plan.words.map((entry) => entry.w)).size).toBe(4)
    expect(plan.nextCursor).toBe(0)
  })

  it('空词书不会抛错', () => {
    const plan = planRound({
      mode: 'alpha',
      ordered: [],
      cursor: 0,
      size: 5,
      shuffle: <T,>(list: readonly T[]) => list.slice()
    })
    expect(plan.words).toEqual([])
    expect(plan.nextCursor).toBe(0)
  })
})
