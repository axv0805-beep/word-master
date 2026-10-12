import { create } from 'zustand'
import type { AnswerResult, DictEntry, RoundResult, Settings, StudyMode } from '../core/types'
import { RoundEngine } from '../core/scheduler'
import { useAppStore } from './appStore'

export interface StartRoundOptions {
  bookId: string
  mode: StudyMode
  /** 本轮首次出现的词 */
  words: DictEntry[]
  /** 抽干扰项用的词池 */
  pool: DictEntry[]
  settings: Settings
  shuffleFirstPass?: boolean
  /** 字母顺序模式下，本轮结束后要推进到的游标位置 */
  nextCursor?: number
}

interface SessionState {
  engine: RoundEngine | null
  bookId: string
  mode: StudyMode
  /** 上一次作答的反馈（非空时界面显示对错反馈） */
  lastResult: AnswerResult | null
  /** 用于触发重渲染的计数器（引擎实例本身不是响应式的） */
  tick: number
  start: (options: StartRoundOptions) => void
  submit: (input: string) => AnswerResult | null
  dismissFeedback: () => void
  finish: () => RoundResult | null
  abort: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  engine: null,
  bookId: '',
  mode: 'random',
  lastResult: null,
  tick: 0,

  start: (options) => {
    const engine = new RoundEngine(
      {
        words: options.words,
        pool: options.pool,
        types: options.settings.questionTypes,
        replayMode: options.settings.mistakeReplayMode,
        replayInterval: options.settings.mistakeReplayInterval,
        shuffleFirstPass: options.shuffleFirstPass ?? options.mode === 'random'
      },
      Date.now()
    )
    nextCursor = options.nextCursor == null ? null : { bookId: options.bookId, cursor: options.nextCursor }
    set({
      engine,
      bookId: options.bookId,
      mode: options.mode,
      lastResult: null,
      tick: get().tick + 1
    })
  },

  submit: (input) => {
    const { engine, bookId } = get()
    if (!engine) return null
    const result = engine.submit(input)
    useAppStore.getState().recordAnswer(bookId, result.question.entry, result.correct, input)
    set({ lastResult: result, tick: get().tick + 1 })
    return result
  },

  dismissFeedback: () => set({ lastResult: null, tick: get().tick + 1 }),

  finish: () => {
    const { engine, bookId, mode } = get()
    if (!engine) return null
    const result = engine.finish({ bookId, mode })
    useAppStore.getState().completeRound(result)
    if (nextCursor) {
      // 只在真正完成一轮（答完所有题目）时推进字母顺序游标
      useAppStore.getState().setAlphaCursor(nextCursor.bookId, nextCursor.cursor)
      nextCursor = null
    }
    set({ engine: null, lastResult: null, tick: get().tick + 1 })
    return result
  },

  abort: () => {
    nextCursor = null
    set({ engine: null, lastResult: null, tick: get().tick + 1 })
  }
}))

/** 字母顺序模式的游标推进（存在模块作用域，避免持久化无意义的状态） */
let nextCursor: { bookId: string; cursor: number } | null = null

