import type { Achievement, DailyStat, RoundResult } from './types'
import { DAY_MS } from './srs'

export type DailyMap = Record<string, DailyStat>

/** 本地日期键 YYYY-MM-DD */
export function dateKey(ts: number): string {
  const d = new Date(ts)
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function emptyDaily(date: string, mastered: number): DailyStat {
  return { date, questions: 0, correct: 0, rounds: 0, ms: 0, mastered }
}

export function ensureDay(daily: DailyMap, date: string, mastered: number): DailyStat {
  return daily[date] ?? emptyDaily(date, mastered)
}

/** 累计一天的学习数据 */
export function updateDaily(
  daily: DailyMap,
  date: string,
  delta: { questions: number; correct: number; rounds: number; ms: number },
  mastered: number
): DailyMap {
  const base = ensureDay(daily, date, mastered)
  return {
    ...daily,
    [date]: {
      date,
      questions: base.questions + delta.questions,
      correct: base.correct + delta.correct,
      rounds: base.rounds + delta.rounds,
      ms: base.ms + delta.ms,
      mastered
    }
  }
}

/** 按日期升序排列的日期键 */
export function sortedDates(daily: DailyMap): string[] {
  return Object.keys(daily).sort()
}

/**
 * 连续打卡天数：从今天（或昨天）往前数连续有练习的天数。
 * 今天还没练不会把连胜清零，避免白天显示为 0。
 */
export function computeStreak(daily: DailyMap, now: number = Date.now()): number {
  const hasPractice = (key: string) => (daily[key]?.questions ?? 0) > 0
  let cursor = now
  if (!hasPractice(dateKey(cursor))) {
    cursor -= DAY_MS
    if (!hasPractice(dateKey(cursor))) return 0
  }
  let streak = 0
  while (hasPractice(dateKey(cursor))) {
    streak += 1
    cursor -= DAY_MS
  }
  return streak
}

export interface SeriesPoint {
  date: string
  label: string
  questions: number
  accuracy: number
  mastered: number
}

/** 生成成长曲线数据（最近 days 天；days 为 'all' 时返回全部记录） */
export function buildSeries(daily: DailyMap, days: number | 'all', now: number = Date.now()): SeriesPoint[] {
  const keys = sortedDates(daily)
  const points: SeriesPoint[] = []

  if (days === 'all') {
    for (const key of keys) {
      const item = daily[key]
      points.push({
        date: key,
        label: key.slice(5),
        questions: item.questions,
        accuracy: item.questions ? item.correct / item.questions : 0,
        mastered: item.mastered
      })
    }
    return points
  }

  for (let i = days - 1; i >= 0; i -= 1) {
    const key = dateKey(now - i * DAY_MS)
    const item = daily[key]
    points.push({
      date: key,
      label: key.slice(5),
      questions: item?.questions ?? 0,
      accuracy: item && item.questions ? item.correct / item.questions : 0,
      mastered: item?.mastered ?? lastKnownMastered(daily, key)
    })
  }
  return points
}

function lastKnownMastered(daily: DailyMap, before: string): number {
  const keys = sortedDates(daily).filter((key) => key <= before)
  const last = keys[keys.length - 1]
  return last ? daily[last].mastered : 0
}

export function totalQuestions(daily: DailyMap): number {
  let total = 0
  for (const item of Object.values(daily)) total += item.questions
  return total
}

export function totalCorrect(daily: DailyMap): number {
  let total = 0
  for (const item of Object.values(daily)) total += item.correct
  return total
}

export function activeDays(daily: DailyMap): number {
  return Object.values(daily).filter((item) => item.questions > 0).length
}

export interface AchievementInput {
  rounds: RoundResult[]
  daily: DailyMap
  mastered: number
  mistakeCount: number
  streak: number
  bestAccuracy: number
}

function ratio(value: number, target: number): number {
  return Math.max(0, Math.min(1, target === 0 ? 1 : value / target))
}

/** 激励设计：成就徽章 */
export function buildAchievements(input: AchievementInput): Achievement[] {
  const { rounds, daily, mastered, mistakeCount, streak, bestAccuracy } = input
  const questions = totalQuestions(daily)
  const hasPerfect = rounds.some((round) => round.answered >= 5 && round.accuracy === 1)

  const defs: Array<Omit<Achievement, 'unlocked' | 'progress'> & { value: number }> = [
    {
      id: 'first-round',
      name: '初次启程',
      description: '完成第一轮练习',
      icon: '🌱',
      value: ratio(rounds.length, 1)
    },
    {
      id: 'questions-100',
      name: '百题斩',
      description: '累计作答 100 题',
      icon: '⚔️',
      value: ratio(questions, 100)
    },
    {
      id: 'questions-1000',
      name: '千题不倒',
      description: '累计作答 1000 题',
      icon: '🏔️',
      value: ratio(questions, 1000)
    },
    {
      id: 'streak-3',
      name: '三日之约',
      description: '连续打卡 3 天',
      icon: '🔥',
      value: ratio(streak, 3)
    },
    {
      id: 'streak-7',
      name: '一周之势',
      description: '连续打卡 7 天',
      icon: '🌟',
      value: ratio(streak, 7)
    },
    {
      id: 'streak-30',
      name: '月度坚持',
      description: '连续打卡 30 天',
      icon: '👑',
      value: ratio(streak, 30)
    },
    {
      id: 'accuracy-90',
      name: '火眼金睛',
      description: '单轮准确率达到 90%',
      icon: '🎯',
      value: ratio(bestAccuracy, 0.9)
    },
    {
      id: 'perfect-round',
      name: '完美一轮',
      description: '完成一轮全对',
      icon: '💯',
      value: hasPerfect ? 1 : 0
    },
    {
      id: 'mastered-100',
      name: '百词入心',
      description: '掌握 100 个单词',
      icon: '📚',
      value: ratio(mastered, 100)
    },
    {
      id: 'mastered-500',
      name: '五百成军',
      description: '掌握 500 个单词',
      icon: '🏆',
      value: ratio(mastered, 500)
    },
    {
      id: 'clear-mistakes',
      name: '扫清障碍',
      description: '错题本清空',
      icon: '🧹',
      value: mistakeCount === 0 && rounds.length > 0 ? 1 : 0
    }
  ]

  return defs.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    unlocked: def.value >= 1,
    progress: def.value
  }))
}

/** 本轮评级 */
export function roundGrade(accuracy: number, answered: number): { grade: string; label: string } {
  if (answered === 0) return { grade: '—', label: '未作答' }
  if (accuracy >= 0.98) return { grade: 'S', label: '完美通关' }
  if (accuracy >= 0.9) return { grade: 'A', label: '表现优秀' }
  if (accuracy >= 0.75) return { grade: 'B', label: '稳步前进' }
  if (accuracy >= 0.6) return { grade: 'C', label: '还需巩固' }
  return { grade: 'D', label: '再来一轮吧' }
}

/** 累计练习时长（分钟） */
export function totalMinutes(daily: DailyMap): number {
  let ms = 0
  for (const item of Object.values(daily)) ms += item.ms
  return Math.round(ms / 60000)
}
