import { create } from 'zustand'
import type { WritingGrade } from '../core/writingGrader'
import type { WritingLevel, WritingMode } from '../core/writing'

/**
 * 正在写的这一篇（不持久化）。
 * 放在 store 里而不是组件 state，是为了从范文页返回时草稿和批改结果都还在。
 */
interface WritingSessionState {
  level: WritingLevel | null
  mode: WritingMode | null
  taskId: string | null
  text: string
  submitted: boolean
  grade: WritingGrade | null
  begin: (level: WritingLevel, mode: WritingMode, taskId: string) => void
  setText: (text: string) => void
  submit: (grade: WritingGrade) => void
  /** 回到编辑态，保留正文 */
  edit: () => void
  reset: () => void
}

export const useWritingSession = create<WritingSessionState>((set) => ({
  level: null,
  mode: null,
  taskId: null,
  text: '',
  submitted: false,
  grade: null,
  begin: (level, mode, taskId) => set({ level, mode, taskId, text: '', submitted: false, grade: null }),
  setText: (text) => set({ text }),
  submit: (grade) => set({ grade, submitted: true }),
  edit: () => set({ submitted: false }),
  reset: () => set({ level: null, mode: null, taskId: null, text: '', submitted: false, grade: null })
}))
