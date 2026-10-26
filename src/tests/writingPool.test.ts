import { beforeEach, describe, expect, it } from 'vitest'
import {
  WRITING_ROUND_SIZE,
  findWritingTask,
  getWritingPool,
  getWritingPoolInfo,
  listWritingPools,
  mergeWritingDrawn,
  pickWritingTask
} from '../data/writing'
import { wordCount } from '../core/writing'

const LEVELS = ['cet4', 'cet6'] as const
const MODES = ['drill', 'mock'] as const

describe('写作题库', () => {
  beforeEach(() => {
    // 固定随机数，抽题结果可复现
    let seed = 1
    Math.random = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
  })

  it('四个题库一共至少 40 题，题号不重复', () => {
    const all = LEVELS.flatMap((level) => MODES.flatMap((mode) => getWritingPool(level, mode)))
    expect(all.length).toBeGreaterThanOrEqual(40)
    const ids = all.map((task) => task.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const level of LEVELS) {
      for (const mode of MODES) {
        expect(getWritingPool(level, mode).length).toBeGreaterThanOrEqual(10)
      }
    }
  })

  it('每道题都有题干、提纲、字数区间与能覆盖字数的范文', () => {
    const all = LEVELS.flatMap((level) => MODES.flatMap((mode) => getWritingPool(level, mode)))
    for (const task of all) {
      expect(task.prompt.length).toBeGreaterThan(10)
      expect(task.outline.length).toBeGreaterThanOrEqual(2)
      expect(task.wordRange[0]).toBeLessThan(task.wordRange[1])
      expect(task.model.essay.length).toBeGreaterThan(200)
      expect(task.model.highlights.length).toBeGreaterThanOrEqual(2)
      const words = wordCount(task.model.essay)
      // 范文本身要写够自己要求的字数
      expect(words).toBeGreaterThanOrEqual(task.wordRange[0] - 5)
      expect(words).toBeLessThanOrEqual(task.wordRange[1] + 30)
    }
  })

  it('真题模拟题都有 2016–2026 的场次标注', () => {
    for (const level of LEVELS) {
      for (const task of getWritingPool(level, 'mock')) {
        expect(task.source).toBeTruthy()
        expect(task.year).toBeGreaterThanOrEqual(2016)
        expect(task.year).toBeLessThanOrEqual(2026)
      }
    }
  })

  it('抽题不会重复，整库写完才重新开始', () => {
    const pool = getWritingPool('cet4', 'drill')
    const seen: string[] = []
    for (let i = 0; i < pool.length; i += 1) {
      const round = pickWritingTask('cet4', 'drill', seen)
      expect(round).not.toBeNull()
      expect(round!.restarted).toBe(false)
      expect(seen).not.toContain(round!.task.id)
      seen.push(round!.task.id)
    }
    expect(new Set(seen).size).toBe(pool.length)
    const next = pickWritingTask('cet4', 'drill', seen)
    expect(next!.restarted).toBe(true)
  })

  it('mergeWritingDrawn 去重且不超出题库', () => {
    const pool = getWritingPool('cet6', 'mock')
    const previous = pool.slice(0, pool.length - 1).map((task) => task.id)
    const merged = mergeWritingDrawn(previous, pool[pool.length - 1].id, pool.length, false)
    expect(merged).toHaveLength(pool.length)
    const restarted = mergeWritingDrawn(pool.map((task) => task.id), pool[0].id, pool.length, true)
    expect(restarted).toEqual([pool[0].id])
  })

  it('分类信息给出题量与建议用时', () => {
    const info = getWritingPoolInfo('cet4', 'drill')
    expect(info.total).toBeGreaterThanOrEqual(10)
    expect(info.minutes).toBeGreaterThan(0)
    expect(listWritingPools()).toHaveLength(4)
    expect(WRITING_ROUND_SIZE).toBe(1)
  })

  it('按题号能找到题目', () => {
    const task = getWritingPool('cet6', 'mock')[3]
    expect(findWritingTask(task.id)?.title).toBe(task.title)
    expect(findWritingTask('不存在')).toBeNull()
  })
})
