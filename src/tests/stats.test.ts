import { describe, expect, it } from 'vitest'
import type { DailyStat, RoundResult } from '../core/types'
import { DAY_MS } from '../core/srs'
import {
  buildAchievements,
  buildSeries,
  computeStreak,
  dateKey,
  roundGrade,
  totalMinutes,
  totalQuestions,
  updateDaily,
  type DailyMap
} from '../core/stats'

function daily(entries: Array<[number, Partial<DailyStat>]>): DailyMap {
  const map: DailyMap = {}
  for (const [offsetDays, value] of entries) {
    const key = dateKey(NOW - offsetDays * DAY_MS)
    map[key] = { date: key, questions: 0, correct: 0, rounds: 0, ms: 0, mastered: 0, ...value }
  }
  return map
}

const NOW = new Date('2025-03-15T12:00:00').getTime()

describe('stats 统计', () => {
  it('日期键使用本地日期', () => {
    expect(dateKey(new Date('2025-03-05T23:10:00').getTime())).toBe('2025-03-05')
  })

  it('累计每日数据', () => {
    const key = dateKey(NOW)
    let map: DailyMap = {}
    map = updateDaily(map, key, { questions: 10, correct: 8, rounds: 1, ms: 60000 }, 5)
    map = updateDaily(map, key, { questions: 5, correct: 5, rounds: 1, ms: 30000 }, 7)
    expect(map[key].questions).toBe(15)
    expect(map[key].correct).toBe(13)
    expect(map[key].rounds).toBe(2)
    expect(map[key].ms).toBe(90000)
    expect(map[key].mastered).toBe(7)
    expect(totalQuestions(map)).toBe(15)
    expect(totalMinutes(map)).toBe(2)
  })

  it('连续打卡：今天有练习则从头数', () => {
    const map = daily([
      [0, { questions: 10 }],
      [1, { questions: 4 }],
      [2, { questions: 6 }],
      [4, { questions: 9 }]
    ])
    expect(computeStreak(map, NOW)).toBe(3)
  })

  it('连续打卡：今天还没练时不把连胜清零', () => {
    const map = daily([
      [1, { questions: 10 }],
      [2, { questions: 4 }]
    ])
    expect(computeStreak(map, NOW)).toBe(2)
  })

  it('连续打卡：间隔超过一天则归零', () => {
    const map = daily([[2, { questions: 10 }]])
    expect(computeStreak(map, NOW)).toBe(0)
  })

  it('成长曲线按天补齐空缺，准确率按当日计算', () => {
    const map = daily([
      [0, { questions: 10, correct: 9, mastered: 12 }],
      [2, { questions: 4, correct: 1, mastered: 8 }]
    ])
    const series = buildSeries(map, 3, NOW)
    expect(series).toHaveLength(3)
    expect(series[0].date).toBe(dateKey(NOW - 2 * DAY_MS))
    expect(series[0].accuracy).toBeCloseTo(0.25, 5)
    expect(series[1].questions).toBe(0)
    expect(series[2].accuracy).toBeCloseTo(0.9, 5)
    expect(series[2].mastered).toBe(12)
  })

  it('成长曲线支持查看全部历史', () => {
    const map = daily([
      [0, { questions: 1 }],
      [5, { questions: 2 }],
      [40, { questions: 3 }]
    ])
    expect(buildSeries(map, 'all', NOW)).toHaveLength(3)
  })

  it('评级按准确率划分', () => {
    expect(roundGrade(1, 10).grade).toBe('S')
    expect(roundGrade(0.91, 10).grade).toBe('A')
    expect(roundGrade(0.8, 10).grade).toBe('B')
    expect(roundGrade(0.65, 10).grade).toBe('C')
    expect(roundGrade(0.3, 10).grade).toBe('D')
    expect(roundGrade(0, 0).grade).toBe('—')
  })

  it('成就徽章按进度解锁', () => {
    const rounds: RoundResult[] = [
      {
        id: 'r1',
        bookId: 'cet4',
        mode: 'alpha',
        seed: 1,
        startedAt: 0,
        endedAt: 1000,
        answered: 10,
        planned: 10,
        correct: 10,
        accuracy: 1,
        firstTryAccuracy: 1,
        durationMs: 1000,
        wrongWords: [],
        words: []
      }
    ]
    const map = daily([[0, { questions: 120, correct: 110, rounds: 1 }]])
    const achievements = buildAchievements({
      rounds,
      daily: map,
      mastered: 150,
      mistakeCount: 0,
      streak: 4,
      bestAccuracy: 1
    })
    const byId = Object.fromEntries(achievements.map((item) => [item.id, item]))
    expect(byId['first-round'].unlocked).toBe(true)
    expect(byId['questions-100'].unlocked).toBe(true)
    expect(byId['questions-1000'].unlocked).toBe(false)
    expect(byId['questions-1000'].progress).toBeCloseTo(0.12, 5)
    expect(byId['streak-3'].unlocked).toBe(true)
    expect(byId['streak-7'].unlocked).toBe(false)
    expect(byId['perfect-round'].unlocked).toBe(true)
    expect(byId['mastered-100'].unlocked).toBe(true)
    expect(byId['clear-mistakes'].unlocked).toBe(true)
  })

  it('错题本非空时"扫清障碍"未解锁', () => {
    const achievements = buildAchievements({
      rounds: [],
      daily: {},
      mastered: 0,
      mistakeCount: 5,
      streak: 0,
      bestAccuracy: 0
    })
    expect(achievements.find((item) => item.id === 'clear-mistakes')?.unlocked).toBe(false)
    expect(achievements.find((item) => item.id === 'first-round')?.unlocked).toBe(false)
  })
})
