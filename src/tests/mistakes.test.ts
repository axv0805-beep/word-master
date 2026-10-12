import { describe, expect, it } from 'vitest'
import type { DictEntry } from '../core/types'
import {
  countMastered,
  countStudied,
  filterMistakes,
  recordCorrect,
  recordWrong,
  removeMistake,
  sortMistakes,
  updateProgressMap,
  wordKey,
  type MistakeMap,
  type ProgressMap
} from '../core/mistakes'
import { createProgress, isDue, nextSrs } from '../core/srs'

const abandon: DictEntry = { w: 'abandon', t: ['放弃'] }
const benefit: DictEntry = { w: 'benefit', t: ['好处'] }

describe('mistakes 错题本与进度', () => {
  it('首次答错建立错题记录，再次答错累加并清零连对', () => {
    let map: MistakeMap = {}
    map = recordWrong(map, 'cet4', abandon, 'abandom', 1000)
    expect(map[wordKey('cet4', 'abandon')].wrong).toBe(1)
    expect(map[wordKey('cet4', 'abandon')].lastWrongInput).toBe('abandom')

    map = recordWrong(map, 'cet4', abandon, 'abandonn', 2000)
    expect(map[wordKey('cet4', 'abandon')].wrong).toBe(2)
    expect(map[wordKey('cet4', 'abandon')].lastWrongAt).toBe(2000)
    expect(map[wordKey('cet4', 'abandon')].correctStreak).toBe(0)
  })

  it('连续答对达到阈值后移出错题本', () => {
    let map: MistakeMap = {}
    map = recordWrong(map, 'cet4', abandon, 'x', 1000)
    map = recordCorrect(map, 'cet4', 'abandon', 2)
    expect(map[wordKey('cet4', 'abandon')].correctStreak).toBe(1)
    map = recordCorrect(map, 'cet4', 'abandon', 2)
    expect(map[wordKey('cet4', 'abandon')]).toBeUndefined()
  })

  it('不在错题本里的词答对不会新增记录', () => {
    let map: MistakeMap = {}
    map = recordCorrect(map, 'cet4', 'abandon', 2)
    expect(Object.keys(map)).toHaveLength(0)
  })

  it('可以手动移除与过滤错题', () => {
    let map: MistakeMap = {}
    map = recordWrong(map, 'cet4', abandon, 'x', 1000)
    map = recordWrong(map, 'cet6', benefit, 'y', 2000)
    expect(filterMistakes(map, 'cet4')).toHaveLength(1)
    expect(filterMistakes(map, 'all')).toHaveLength(2)
    map = removeMistake(map, wordKey('cet4', 'abandon'))
    expect(filterMistakes(map, 'all')).toHaveLength(1)
  })

  it('错题排序支持按错误次数与最近出错时间', () => {
    let map: MistakeMap = {}
    map = recordWrong(map, 'cet4', abandon, 'x', 1000)
    map = recordWrong(map, 'cet4', abandon, 'x', 1500)
    map = recordWrong(map, 'cet4', benefit, 'y', 3000)
    expect(sortMistakes(map, 'wrong')[0].word).toBe('abandon')
    expect(sortMistakes(map, 'recent')[0].word).toBe('benefit')
  })

  it('单词进度累加并在连对达标后标记为掌握', () => {
    let map: ProgressMap = {}
    const key = wordKey('cet4', 'abandon')
    map = updateProgressMap(map, key, true, 1000, 3)
    map = updateProgressMap(map, key, true, 2000, 3)
    expect(map[key].streak).toBe(2)
    expect(map[key].mastered).toBe(false)
    map = updateProgressMap(map, key, true, 3000, 3)
    expect(map[key].mastered).toBe(true)
    expect(map[key].correct).toBe(3)

    map = updateProgressMap(map, key, false, 4000, 3)
    expect(map[key].streak).toBe(0)
    expect(map[key].mastered).toBe(false)
    expect(map[key].wrong).toBe(1)
  })

  it('统计掌握词数与某本书已学词数', () => {
    let map: ProgressMap = {}
    map = updateProgressMap(map, wordKey('cet4', 'abandon'), true, 1, 1)
    map = updateProgressMap(map, wordKey('cet4', 'benefit'), true, 1, 1)
    map = updateProgressMap(map, wordKey('cet6', 'cancel'), true, 1, 1)
    expect(countMastered(map)).toBe(3)
    expect(countStudied(map, 'cet4')).toBe(2)
    expect(countStudied(map, 'cet6')).toBe(1)
  })
})

describe('srs 间隔重复', () => {
  const NOW = 1_700_000_000_000
  const DAY = 24 * 60 * 60 * 1000

  it('新词首次答对间隔 1 天', () => {
    const result = nextSrs(createProgress(NOW), true, NOW)
    expect(result.intervalDays).toBe(1)
    expect(result.dueAt).toBe(NOW + DAY)
    expect(result.ef).toBeCloseTo(2.6, 5)
  })

  it('第二次答对间隔 3 天', () => {
    const result = nextSrs({ ef: 2.6, intervalDays: 1 }, true, NOW)
    expect(result.intervalDays).toBe(3)
  })

  it('之后按难度因子放大间隔', () => {
    const result = nextSrs({ ef: 2.5, intervalDays: 3 }, true, NOW)
    expect(result.intervalDays).toBe(Math.round(3 * 2.6))
  })

  it('答错则间隔归零并在 10 分钟后重现，难度因子下调但有下限', () => {
    const result = nextSrs({ ef: 1.4, intervalDays: 5 }, false, NOW)
    expect(result.intervalDays).toBe(0)
    expect(result.dueAt).toBe(NOW + 10 * 60 * 1000)
    expect(result.ef).toBe(1.3)
  })

  it('到期判断：未学过的词视为到期，已掌握的词不再到期', () => {
    expect(isDue(undefined, NOW)).toBe(true)
    expect(isDue({ ...createProgress(NOW), dueAt: NOW + DAY }, NOW)).toBe(false)
    expect(isDue({ ...createProgress(NOW), dueAt: NOW - 1 }, NOW)).toBe(true)
    expect(isDue({ ...createProgress(NOW), mastered: true, dueAt: NOW - 1 }, NOW)).toBe(false)
  })
})
