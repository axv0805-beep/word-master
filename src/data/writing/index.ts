import { CET4_DRILL } from './cet4-drill'
import { CET4_MOCK } from './cet4-mock'
import { CET6_DRILL } from './cet6-drill'
import { CET6_MOCK } from './cet6-mock'
import {
  WRITING_LEVEL_LABEL,
  WRITING_MODE_LABEL,
  estimateWritingMinutes,
  wordCount,
  type WritingLevel,
  type WritingMode,
  type WritingTask
} from '../../core/writing'

/**
 * 写作题库注册表：四个文件各 10 题，共 40 题。
 * 专项训练练功能段落，真题模拟按场次重写，材料与范文均为原创仿真。
 */

const TASKS: Record<WritingLevel, Record<WritingMode, WritingTask[]>> = {
  cet4: { drill: CET4_DRILL, mock: CET4_MOCK },
  cet6: { drill: CET6_DRILL, mock: CET6_MOCK }
}

export function getWritingPool(level: WritingLevel, mode: WritingMode): WritingTask[] {
  return TASKS[level]?.[mode] ?? []
}

export interface WritingPoolInfo {
  level: WritingLevel
  mode: WritingMode
  total: number
  minutes: number
  title: string
}

export function getWritingPoolInfo(level: WritingLevel, mode: WritingMode): WritingPoolInfo {
  const pool = getWritingPool(level, mode)
  const minutes = Math.round(pool.reduce((sum, task) => sum + estimateWritingMinutes(task), 0) / Math.max(pool.length, 1))
  return {
    level,
    mode,
    total: pool.length,
    minutes,
    title: `${WRITING_LEVEL_LABEL[level]}写作 · ${WRITING_MODE_LABEL[mode]}`
  }
}

export function listWritingPools(): WritingPoolInfo[] {
  return (['cet4', 'cet6'] as const).flatMap((level) =>
    (['drill', 'mock'] as const).map((mode) => getWritingPoolInfo(level, mode))
  )
}

export function findWritingTask(taskId: string): WritingTask | null {
  for (const level of ['cet4', 'cet6'] as const) {
    for (const mode of ['drill', 'mock'] as const) {
      const found = getWritingPool(level, mode).find((task) => task.id === taskId)
      if (found) return found
    }
  }
  return null
}

/** 写作一轮只抽一道（一次训练就是一篇作文） */
export const WRITING_ROUND_SIZE = 1

export interface WritingRound {
  task: WritingTask
  restarted: boolean
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** 从没做过的题里抽一道；做完了就整库重来 */
export function pickWritingTask(level: WritingLevel, mode: WritingMode, drawn: string[] = []): WritingRound | null {
  const pool = getWritingPool(level, mode)
  if (pool.length === 0) return null
  const done = new Set(drawn)
  const remaining = pool.filter((task) => !done.has(task.id))
  if (remaining.length === 0) {
    return { task: shuffle(pool)[0], restarted: true }
  }
  return { task: shuffle(remaining)[0], restarted: false }
}

export function mergeWritingDrawn(previous: string[], next: string, poolSize: number, restarted: boolean): string[] {
  const merged = restarted ? [next] : Array.from(new Set([...previous, next]))
  return merged.length > poolSize ? [next] : merged
}

/** 分类页显示用：题库题数 + 建议单词区间 */
export function describeWordRange(task: WritingTask): string {
  return `${task.wordRange[0]}–${task.wordRange[1]} 词`
}

/** 批改页/结果页显示用：实际字数 */
export function countTaskWords(text: string): number {
  return wordCount(text)
}
