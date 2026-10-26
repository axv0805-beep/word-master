/**
 * 写作训练的类型定义。
 * 一个 task = 一道作文题：题干 + 提纲 + 范文；
 * 专项训练与真题模拟共用同一套「写 → 批改 → 看范文」流程。
 */

export type WritingLevel = 'cet4' | 'cet6'
export type WritingMode = 'drill' | 'mock'

/** 题型：议论文 / 书信 / 通知 / 图表 / 演讲稿 / 建议书 */
export type WritingGenre = 'argument' | 'letter' | 'notice' | 'chart' | 'speech' | 'proposal'

export const WRITING_LEVEL_LABEL: Record<WritingLevel, string> = { cet4: '四级', cet6: '六级' }
export const WRITING_MODE_LABEL: Record<WritingMode, string> = { drill: '专项训练', mock: '真题模拟' }
export const GENRE_LABEL: Record<WritingGenre, string> = {
  argument: '议论文',
  letter: '书信',
  notice: '通知',
  chart: '图表作文',
  speech: '演讲稿',
  proposal: '建议书'
}

export interface WritingHighlight {
  /** 范文里的表达 */
  phrase: string
  /** 中文说明：为什么值得学 */
  note: string
}

export interface WritingModel {
  essay: string
  highlights: WritingHighlight[]
  /** 结构上的建议，批改页与范文页都会展示 */
  structure?: string
}

export interface WritingTask {
  id: string
  level: WritingLevel
  mode: WritingMode
  genre: WritingGenre
  /** 题干要求（中文），模拟卷的口吻 */
  prompt: string
  /** 英文标题/主题，作文题面一般会给 */
  title: string
  /** 提纲要点（中文），写作时需要覆盖 */
  outline: string[]
  /** 建议字数区间 */
  wordRange: [number, number]
  /** 建议用时（分钟） */
  minutes: number
  /** 真题模拟题的对应场次（仿真标注） */
  source?: string
  year?: number
  model: WritingModel
}

export function wordCount(text: string): number {
  const words = text.match(/[A-Za-z][A-Za-z'’-]*/g)
  return words ? words.length : 0
}

/** 预计用时：专项训练写作 + 批改浏览 */
export function estimateWritingMinutes(task: WritingTask): number {
  return task.minutes + 2
}
