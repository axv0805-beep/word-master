import { clampDailyGoal, clampRoundSize } from './constants'

/**
 * 学习计划推算：按每日目标算出「整本书要背多少天」。
 * 纯函数，方便单测与在首页/设置页/引导页三处共用同一套口径。
 */

export interface StudyPlan {
  bookId: string
  bookName: string
  /** 词书总词数 */
  totalWords: number
  /** 已学词数（重设计划时用于扣减） */
  studiedWords: number
  /** 还需学习的词数 */
  remainingWords: number
  /** 每天计划背多少词 */
  dailyGoal: number
  /** 每轮单词数 */
  roundSize: number
  /** 预计需要多少天（已学完为 0） */
  days: number
  /** 每天大约要完成几轮 */
  roundsPerDay: number
  /** 预计完成日期（第 1 天是今天） */
  finishDate: Date
}

/**
 * 预计天数：向上取整。
 * 剩余 0 词 → 0 天；剩余 1 词而目标 30 → 仍然算 1 天（不会出现 0.03 天）。
 */
export function estimateDays(remainingWords: number, dailyGoal: number): number {
  const remaining = Math.max(0, Math.floor(remainingWords))
  if (remaining === 0) return 0
  const goal = Math.max(1, Math.floor(dailyGoal))
  return Math.ceil(remaining / goal)
}

/**
 * 预计完成日期。
 * 第 1 天就是今天，所以 days=1 → 今天完成；days=0 → 保持今天（尚未开始）。
 */
export function projectFinishDate(days: number, from: Date = new Date()): Date {
  const finish = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const offset = Math.max(0, days - 1)
  finish.setDate(finish.getDate() + offset)
  return finish
}

export interface BuildPlanInput {
  bookId: string
  bookName: string
  totalWords: number
  studiedWords?: number
  dailyGoal: number
  roundSize: number
  from?: Date
}

export function buildStudyPlan(input: BuildPlanInput): StudyPlan {
  const totalWords = Math.max(0, Math.floor(input.totalWords))
  const studiedWords = Math.min(totalWords, Math.max(0, Math.floor(input.studiedWords ?? 0)))
  const remainingWords = Math.max(0, totalWords - studiedWords)
  const dailyGoal = clampDailyGoal(input.dailyGoal)
  const roundSize = clampRoundSize(input.roundSize)
  const days = estimateDays(remainingWords, dailyGoal)

  return {
    bookId: input.bookId,
    bookName: input.bookName,
    totalWords,
    studiedWords,
    remainingWords,
    dailyGoal,
    roundSize,
    days,
    roundsPerDay: Math.max(1, Math.ceil(dailyGoal / roundSize)),
    finishDate: projectFinishDate(days, input.from ?? new Date())
  }
}

/** 把天数写成「约 3 个月」「约 2 周」这种人话 */
export function humanizeDays(days: number): string {
  if (days <= 0) return '已完成'
  if (days === 1) return '今天'
  if (days < 7) return `${days} 天`
  if (days < 30) return `约 ${(days / 7).toFixed(days % 7 === 0 ? 0 : 1)} 周`
  if (days < 365) return `约 ${(days / 30).toFixed(days % 30 === 0 ? 0 : 1)} 个月`
  return `约 ${(days / 365).toFixed(1)} 年`
}

/** 预计完成日期的展示文本 */
export function formatFinishDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}
