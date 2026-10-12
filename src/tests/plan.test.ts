import { describe, expect, it } from 'vitest'
import {
  DAILY_GOAL_PRESETS,
  MAX_DAILY_GOAL,
  MIN_DAILY_GOAL,
  clampDailyGoal
} from '../core/constants'
import { buildStudyPlan, estimateDays, formatFinishDate, humanizeDays, projectFinishDate } from '../core/plan'

const FROM = new Date(2025, 5, 10, 9, 30) // 2025-06-10 周二

describe('每日目标取值范围', () => {
  it('常量与档位定义一致', () => {
    expect(MIN_DAILY_GOAL).toBe(5)
    expect(MAX_DAILY_GOAL).toBe(300)
    expect(DAILY_GOAL_PRESETS.every((value) => value >= MIN_DAILY_GOAL && value <= MAX_DAILY_GOAL)).toBe(true)
  })

  it('夹取到 5–300 并对齐到 5 的倍数', () => {
    expect(clampDailyGoal(1)).toBe(5)
    expect(clampDailyGoal(5)).toBe(5)
    expect(clampDailyGoal(33)).toBe(35)
    expect(clampDailyGoal(32)).toBe(30)
    expect(clampDailyGoal(300)).toBe(300)
    expect(clampDailyGoal(999)).toBe(300)
  })

  it('非法输入回退默认值', () => {
    expect(clampDailyGoal(undefined)).toBe(30)
    expect(clampDailyGoal(null)).toBe(30)
    expect(clampDailyGoal('abc')).toBe(30)
    expect(clampDailyGoal(NaN)).toBe(30)
    expect(clampDailyGoal('50')).toBe(50)
    expect(clampDailyGoal(Infinity)).toBe(300)
    expect(clampDailyGoal(-Infinity)).toBe(5)
  })
})

describe('预计天数', () => {
  it('按每日目标向上取整', () => {
    expect(estimateDays(2607, 30)).toBe(87)
    expect(estimateDays(2607, 29)).toBe(90)
    expect(estimateDays(100, 50)).toBe(2)
  })

  it('刚好整除时不多算一天', () => {
    expect(estimateDays(300, 30)).toBe(10)
    expect(estimateDays(30, 30)).toBe(1)
  })

  it('剩余为 0 时是 0 天，剩余很少也算 1 天', () => {
    expect(estimateDays(0, 30)).toBe(0)
    expect(estimateDays(-5, 30)).toBe(0)
    expect(estimateDays(1, 30)).toBe(1)
  })

  it('目标是 0 或负数时按 1 词/天处理，不会除以零', () => {
    expect(estimateDays(10, 0)).toBe(10)
    expect(estimateDays(10, -3)).toBe(10)
  })

  it('小数词数向下取整后再计算', () => {
    expect(estimateDays(30.9, 30)).toBe(1)
    expect(estimateDays(31.2, 30)).toBe(2)
  })

  it('常见词书 × 常见目标的天数（四级 2607 词）', () => {
    expect(estimateDays(2607, 10)).toBe(261)
    expect(estimateDays(2607, 20)).toBe(131)
    expect(estimateDays(2607, 30)).toBe(87)
    expect(estimateDays(2607, 50)).toBe(53)
    expect(estimateDays(2607, 100)).toBe(27)
  })
})

describe('预计完成日期', () => {
  it('第 1 天就是今天，所以 1 天 → 今天完成', () => {
    expect(formatFinishDate(projectFinishDate(1, FROM))).toBe(formatFinishDate(new Date(2025, 5, 10)))
  })

  it('3 天 → 今天 + 2 天', () => {
    const finish = projectFinishDate(3, FROM)
    expect(finish.getFullYear()).toBe(2025)
    expect(finish.getMonth()).toBe(5)
    expect(finish.getDate()).toBe(12)
  })

  it('跨月正确', () => {
    const finish = projectFinishDate(25, new Date(2025, 5, 10))
    expect(finish.getMonth()).toBe(6)
    expect(finish.getDate()).toBe(4)
  })

  it('0 天时保持今天，不会跑到过去', () => {
    const finish = projectFinishDate(0, FROM)
    expect(finish.getDate()).toBe(10)
  })

  it('忽略传入时间的时分秒', () => {
    const finish = projectFinishDate(5, new Date(2025, 5, 10, 23, 59, 59))
    expect(finish.getDate()).toBe(14)
    expect(finish.getHours()).toBe(0)
    expect(finish.getMinutes()).toBe(0)
  })
})

describe('人类可读的天数', () => {
  it('按量级换成天 / 周 / 月 / 年', () => {
    expect(humanizeDays(0)).toBe('已完成')
    expect(humanizeDays(1)).toBe('今天')
    expect(humanizeDays(5)).toBe('5 天')
    expect(humanizeDays(14)).toBe('约 2 周')
    expect(humanizeDays(87)).toBe('约 2.9 个月')
    expect(humanizeDays(400)).toBe('约 1.1 年')
  })
})

describe('学习计划推算 buildStudyPlan', () => {
  it('未开始时用整本书的词数', () => {
    const plan = buildStudyPlan({
      bookId: 'cet4',
      bookName: '四级核心',
      totalWords: 2607,
      studiedWords: 0,
      dailyGoal: 30,
      roundSize: 20,
      from: FROM
    })
    expect(plan.remainingWords).toBe(2607)
    expect(plan.days).toBe(87)
    expect(plan.roundsPerDay).toBe(2)
    expect(plan.dailyGoal).toBe(30)
    expect(plan.roundSize).toBe(20)
  })

  it('已学过的词会被扣除，天数相应变少', () => {
    const plan = buildStudyPlan({
      bookId: 'cet4',
      bookName: '四级核心',
      totalWords: 2607,
      studiedWords: 2000,
      dailyGoal: 30,
      roundSize: 20,
      from: FROM
    })
    expect(plan.remainingWords).toBe(607)
    expect(plan.days).toBe(21)
  })

  it('已学数不会超过总词数', () => {
    const plan = buildStudyPlan({
      bookId: 'cet4',
      bookName: '四级核心',
      totalWords: 2607,
      studiedWords: 9999,
      dailyGoal: 30,
      roundSize: 20,
      from: FROM
    })
    expect(plan.remainingWords).toBe(0)
    expect(plan.days).toBe(0)
    expect(humanizeDays(plan.days)).toBe('已完成')
  })

  it('传入越界的每日目标与每轮词数会被夹到合法范围', () => {
    const plan = buildStudyPlan({
      bookId: 'cet4',
      bookName: '四级核心',
      totalWords: 1000,
      studiedWords: 0,
      dailyGoal: 9999,
      roundSize: 999,
      from: FROM
    })
    expect(plan.dailyGoal).toBe(MAX_DAILY_GOAL)
    expect(plan.roundSize).toBe(30)
  })

  it('空词书不会崩溃', () => {
    const plan = buildStudyPlan({
      bookId: 'custom',
      bookName: '空词表',
      totalWords: 0,
      studiedWords: 0,
      dailyGoal: 30,
      roundSize: 20,
      from: FROM
    })
    expect(plan.days).toBe(0)
    expect(plan.remainingWords).toBe(0)
    expect(plan.roundsPerDay).toBeGreaterThanOrEqual(1)
  })

  it('目标小于一轮时每天仍然至少 1 轮', () => {
    const plan = buildStudyPlan({
      bookId: 'cet4',
      bookName: '四级核心',
      totalWords: 100,
      studiedWords: 0,
      dailyGoal: 5,
      roundSize: 30,
      from: FROM
    })
    expect(plan.roundsPerDay).toBe(1)
  })
})
