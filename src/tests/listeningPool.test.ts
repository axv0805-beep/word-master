import { describe, expect, it } from 'vitest'
import {
  getListeningPool,
  getListeningPoolInfo,
  listListeningPools,
  mergeDrawn,
  pickListeningRound,
  ROUND_SIZE
} from '../data/listening'
import type { ListeningLevel, ListeningMode } from '../core/listening'

const LEVELS: ListeningLevel[] = ['cet4', 'cet6']
const MODES: ListeningMode[] = ['drill', 'mock']

describe('听力题库与抽题', () => {
  it('四个题库各 26 道、合计 104 道，题号唯一', () => {
    const totals = LEVELS.flatMap((level) => MODES.map((mode) => getListeningPool(level, mode).length))
    expect(totals).toEqual([26, 26, 26, 26])
    expect(totals.reduce((sum, value) => sum + value, 0)).toBeGreaterThanOrEqual(100)

    const ids = LEVELS.flatMap((level) => MODES.flatMap((mode) => getListeningPool(level, mode).map((item) => item.id)))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每道题都有 4 个选项、答案下标合法、解析与大意都不为空', () => {
    for (const level of LEVELS) {
      for (const mode of MODES) {
        for (const item of getListeningPool(level, mode)) {
          expect(item.options).toHaveLength(4)
          expect(item.answer).toBeGreaterThanOrEqual(0)
          expect(item.answer).toBeLessThan(item.options.length)
          expect(item.explain.length).toBeGreaterThan(6)
          expect(item.summary.length).toBeGreaterThan(6)
          expect(item.material.length).toBeGreaterThan(0)
          expect(item.stem.endsWith('?')).toBe(true)
        }
      }
    }
  })

  it('真题模拟题都标了 2016–2026 的场次', () => {
    for (const level of LEVELS) {
      const mock = getListeningPool(level, 'mock')
      for (const item of mock) {
        expect(item.source, `${item.id} 缺少 source`).toBeTruthy()
        expect(item.year).toBeGreaterThanOrEqual(2016)
        expect(item.year).toBeLessThanOrEqual(2026)
      }
    }
  })

  it('每轮抽 6 道，连续抽 4 轮（24 道）不会重复', () => {
    for (const level of LEVELS) {
      for (const mode of MODES) {
        let drawn: string[] = []
        const seen = new Set<string>()
        for (let round = 0; round < 4; round += 1) {
          const picked = pickListeningRound(level, mode, drawn)
          expect(picked.items).toHaveLength(ROUND_SIZE)
          expect(picked.restarted).toBe(false)
          for (const item of picked.items) {
            expect(seen.has(item.id), `${item.id} 被重复抽到了`).toBe(false)
            seen.add(item.id)
          }
          drawn = mergeDrawn(drawn, picked.ids, getListeningPool(level, mode).length, picked.restarted)
          expect(drawn).toHaveLength((round + 1) * ROUND_SIZE)
        }
      }
    }
  })

  it('题池快抽干时重新开始，并给出 restarted 标记', () => {
    const pool = getListeningPool('cet4', 'drill')
    const almostAll = pool.slice(0, pool.length - 3).map((item) => item.id)
    const picked = pickListeningRound('cet4', 'drill', almostAll)
    expect(picked.restarted).toBe(true)
    expect(picked.items).toHaveLength(ROUND_SIZE)
    // 重新开始后清空记账，只保留这一轮的 6 个
    expect(mergeDrawn(almostAll, picked.ids, pool.length, true)).toEqual(picked.ids)
  })

  it('合并记账时去重，抽满整库会回到本轮', () => {
    const pool = getListeningPool('cet6', 'mock')
    const all = pool.map((item) => item.id)
    expect(mergeDrawn(all.slice(0, 4), all.slice(2, 6), pool.length, false)).toEqual(all.slice(0, 6))
    expect(mergeDrawn(all.slice(0, 25), all.slice(24), pool.length, false)).toHaveLength(pool.length)
  })

  it('分类页用的题量与时长信息', () => {
    const info = getListeningPoolInfo('cet6', 'mock')
    expect(info.total).toBe(26)
    expect(info.roundSize).toBe(ROUND_SIZE)
    expect(info.minutes).toBeGreaterThan(0)
    expect(listListeningPools()).toHaveLength(4)
  })
})
