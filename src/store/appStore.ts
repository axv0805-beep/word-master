import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  DictEntry,
  DailyStat,
  ListeningMistake,
  WritingRecord,
  RoundResult,
  Settings,
  StudyState,
  WordProgress
} from '../core/types'
import type { MistakeMap, ProgressMap } from '../core/mistakes'
import {
  countMastered,
  countStudied,
  filterMistakes,
  recordCorrect,
  recordWrong,
  removeMistake,
  updateProgressMap,
  wordKey
} from '../core/mistakes'
import { dateKey, ensureDay, updateDaily, type DailyMap } from '../core/stats'
import { clampDailyGoal, clampRoundSizeFor } from '../core/constants'
import type { CustomBook } from '../core/dictionaryLoader'

export const DEFAULT_SETTINGS: Settings = {
  bookId: 'cet4',
  roundSize: 20,
  questionTypes: ['zh2en', 'en2zh', 'spelling'],
  mistakeReplayMode: 'interval',
  mistakeReplayInterval: 10,
  mistakeClearStreak: 2,
  autoSpeak: true,
  accent: 'us',
  onlineAudio: true,
  // 听力音色：空 = 自动；设置页里可以选设备上装了的任意英语语音
  speechVoice: '',
  dailyGoal: 30,
  theme: 'forest',
  showPhoneticInSpelling: true,
  homeView: 'sprout',
  onboarded: false
}

const MAX_ROUNDS = 300

export interface AppState {
  settings: Settings
  progress: ProgressMap
  mistakes: MistakeMap
  daily: DailyMap
  rounds: RoundResult[]
  study: StudyState
  customBooks: CustomBook[]
  /** 听力抽题记账：key 是 `${level}:${mode}`，值是已经抽过的题号 */
  listeningDrawn: Record<string, string[]>
  /** 听力错题本 */
  listeningMistakes: ListeningMistake[]
  /** 写作抽题记账：key 是 `${level}:${mode}`，值是已经写过的题号 */
  writingDrawn: Record<string, string[]>
  /** 写作得分记录（最近的在前，最多 40 条） */
  writingRecords: WritingRecord[]

  updateSettings: (patch: Partial<Settings>) => void
  /** 完成首次引导：一次性写入所选词书、每日目标与每轮单词数 */
  finishOnboarding: (plan: { bookId: string; dailyGoal: number; roundSize?: number }) => void
  recordAnswer: (bookId: string, entry: DictEntry, correct: boolean, input: string) => void
  completeRound: (result: RoundResult) => void
  dropMistake: (key: string) => void
  clearMistakeBook: () => void
  setAlphaCursor: (bookId: string, cursor: number) => void
  setLastLetter: (bookId: string, letter: string) => void
  setCustomBooks: (books: CustomBook[]) => void
  markListeningDrawn: (level: 'cet4' | 'cet6', mode: 'drill' | 'mock', ids: string[], restarted: boolean) => void
  /** 答错时记一条；同一道题重复答错只累加次数 */
  recordListeningMistake: (entry: Omit<ListeningMistake, 'key' | 'wrong' | 'lastWrongAt'>) => void
  dropListeningMistake: (key: string) => void
  clearListeningMistakes: () => void
  markWritingDrawn: (level: 'cet4' | 'cet6', mode: 'drill' | 'mock', taskId: string, restarted: boolean) => void
  recordWritingResult: (entry: Omit<WritingRecord, 'at'>) => void
  clearWritingRecords: () => void
  resetProgress: () => void
  resetAll: () => void
}

const EMPTY_STUDY: StudyState = { alphaCursor: {}, lastLetter: {} }

/** 内存兜底存储：无 localStorage（无痕模式、测试环境）时保证功能可用且不刷警告 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key)
    },
    setItem: (key: string, value: string) => {
      map.set(key, value)
    }
  }
}

const memoryStorage = createMemoryStorage()

/** 优先用 localStorage，不可用时退回内存存储 */
function pickStorage(): Storage {
  try {
    if (typeof localStorage !== 'undefined') {
      const probe = '__word_master_probe__'
      localStorage.setItem(probe, '1')
      localStorage.removeItem(probe)
      return localStorage
    }
  } catch {
    /* 隐私模式 / 配额限制 → 用内存存储 */
  }
  return memoryStorage
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

/**
 * 合并本地存储里的旧数据。
 *
 * zustand persist 默认是「整个 state 浅合并」，持久化数据里缺哪个字段，哪个字段就会变成
 * undefined（常见于：版本升级新增了设置项、写入被中断、手工改过 localStorage），
 * 结果就是「每日目标 0 / 题」「词书内容不足」这类难以定位的问题。
 * 这里逐字段回退到默认值，保证任何残缺数据都能正常启动。
 */
export function mergePersistedState(persisted: unknown, current: AppState): AppState {
  const saved = asRecord(persisted)
  const savedSettings = asRecord(saved.settings)
  const settings = { ...DEFAULT_SETTINGS, ...(savedSettings as Partial<Settings>) }

  // 升级前没有 onboarded 字段：已经在用的老用户不该被强制走一遍引导。
  // 注意要用「存档里是否真的写过这个字段」来判断，不能看合并后的值——
  // DEFAULT_SETTINGS.onboarded 是 false，会把推断短路掉。
  const hasExistingData =
    Object.keys(asRecord(saved.progress)).length > 0 ||
    Object.keys(asRecord(saved.daily)).length > 0 ||
    (Array.isArray(saved.rounds) && saved.rounds.length > 0)
  const onboarded = typeof savedSettings.onboarded === 'boolean' ? savedSettings.onboarded : hasExistingData

  // 每日目标决定每轮单词数的上限，两者要一起归一化，避免出现「每轮 30 词但每天只背 20 词」
  const dailyGoal = clampDailyGoal(settings.dailyGoal, DEFAULT_SETTINGS.dailyGoal)
  const roundSize = clampRoundSizeFor(settings.roundSize, dailyGoal, DEFAULT_SETTINGS.roundSize)

  return {
    ...current,
    ...(saved as Partial<AppState>),
    settings: {
      ...settings,
      dailyGoal,
      roundSize,
      onboarded
    },

    study: { alphaCursor: {}, lastLetter: {}, ...(asRecord(saved.study) as Partial<StudyState>) },
    progress: (asRecord(saved.progress) as unknown as ProgressMap) ?? {},
    mistakes: (asRecord(saved.mistakes) as unknown as MistakeMap) ?? {},
    daily: (asRecord(saved.daily) as unknown as DailyMap) ?? {},
    rounds: Array.isArray(saved.rounds) ? (saved.rounds as RoundResult[]) : [],
    customBooks: Array.isArray(saved.customBooks) ? (saved.customBooks as CustomBook[]) : [],
    listeningDrawn: (asRecord(saved.listeningDrawn) as Record<string, string[]>) ?? {},
    listeningMistakes: Array.isArray(saved.listeningMistakes) ? (saved.listeningMistakes as ListeningMistake[]) : [],
    writingDrawn: (asRecord(saved.writingDrawn) as Record<string, string[]>) ?? {},
    writingRecords: Array.isArray(saved.writingRecords) ? (saved.writingRecords as WritingRecord[]) : []
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_SETTINGS, theme: 'forest' },
      progress: {},
      mistakes: {},
      daily: {},
      rounds: [],
      study: EMPTY_STUDY,
      customBooks: [],
      listeningDrawn: {},
      listeningMistakes: [],
      writingDrawn: {},
      writingRecords: [],

      updateSettings: (patch) =>
        set((state) => {
          const merged = { ...state.settings, ...patch }
          const dailyGoal = clampDailyGoal(merged.dailyGoal, state.settings.dailyGoal)
          // 每轮单词数在这里按（可能是新的）每日目标夹取：
          // 目标调小 → 每轮上限跟着变小；目标调大 → 已选值保持。
          const roundSize = clampRoundSizeFor(merged.roundSize, dailyGoal, state.settings.roundSize)
          return { settings: { ...merged, dailyGoal, roundSize } }
        }),

      finishOnboarding: ({ bookId, dailyGoal, roundSize }) =>
        set((state) => {
          const goal = clampDailyGoal(dailyGoal, state.settings.dailyGoal)
          const chosen = roundSize == null ? state.settings.roundSize : roundSize
          return {
            settings: {
              ...state.settings,
              bookId: bookId || state.settings.bookId,
              dailyGoal: goal,
              roundSize: clampRoundSizeFor(chosen, goal, state.settings.roundSize),
              onboarded: true
            }
          }
        }),

      recordAnswer: (bookId, entry, correct, input) => {
        const now = Date.now()
        set((state) => {
          const key = wordKey(bookId, entry.w)
          const progress = updateProgressMap(state.progress, key, correct, now, state.settings.mistakeClearStreak)
          const mistakes = correct
            ? recordCorrect(state.mistakes, bookId, entry.w, state.settings.mistakeClearStreak)
            : recordWrong(state.mistakes, bookId, entry, input, now)
          return { progress, mistakes }
        })
      },

      completeRound: (result) => {
        const now = Date.now()
        set((state) => {
          const mastered = countMastered(state.progress)
          const day = dateKey(now)
          const daily = updateDaily(
            state.daily,
            day,
            {
              questions: result.answered,
              correct: result.correct,
              rounds: 1,
              ms: result.durationMs
            },
            mastered
          )
          const rounds = [result, ...state.rounds].slice(0, MAX_ROUNDS)
          return { daily, rounds }
        })
      },

      dropMistake: (key) => set((state) => ({ mistakes: removeMistake(state.mistakes, key) })),

      clearMistakeBook: () => set({ mistakes: {} }),

      setAlphaCursor: (bookId, cursor) =>
        set((state) => ({ study: { ...state.study, alphaCursor: { ...state.study.alphaCursor, [bookId]: cursor } } })),

      setLastLetter: (bookId, letter) =>
        set((state) => ({ study: { ...state.study, lastLetter: { ...state.study.lastLetter, [bookId]: letter } } })),

      setCustomBooks: (books) => set({ customBooks: books }),

      markListeningDrawn: (level, mode, ids, restarted) =>
        set((state) => {
          const key = `${level}:${mode}`
          const previous = state.listeningDrawn[key] ?? []
          const next = restarted
            ? Array.from(new Set(ids))
            : Array.from(new Set([...previous, ...ids]))
          return { listeningDrawn: { ...state.listeningDrawn, [key]: next } }
        }),

      recordListeningMistake: (entry) =>
        set((state) => {
          const key = `${entry.level}:${entry.mode}:${entry.itemId}`
          const now = Date.now()
          const existing = state.listeningMistakes.find((item) => item.key === key)
          const next = existing
            ? state.listeningMistakes.map((item) =>
                item.key === key ? { ...item, chosen: entry.chosen, wrong: item.wrong + 1, lastWrongAt: now } : item
              )
            : [{ ...entry, key, wrong: 1, lastWrongAt: now }, ...state.listeningMistakes]
          return { listeningMistakes: next }
        }),

      dropListeningMistake: (key) =>
        set((state) => ({ listeningMistakes: state.listeningMistakes.filter((item) => item.key !== key) })),

      clearListeningMistakes: () => set({ listeningMistakes: [] }),

      markWritingDrawn: (level, mode, taskId, restarted) =>
        set((state) => {
          const key = `${level}:${mode}`
          const previous = state.writingDrawn[key] ?? []
          const next = restarted ? [taskId] : Array.from(new Set([...previous, taskId]))
          return { writingDrawn: { ...state.writingDrawn, [key]: next } }
        }),

      recordWritingResult: (entry) =>
        set((state) => ({
          writingRecords: [{ ...entry, at: Date.now() }, ...state.writingRecords].slice(0, 40)
        })),

      clearWritingRecords: () => set({ writingRecords: [] }),

      resetProgress: () =>
        set({
          progress: {},
          mistakes: {},
          daily: {},
          rounds: [],
          study: EMPTY_STUDY,
          listeningDrawn: {},
          listeningMistakes: [],
          writingDrawn: {},
          writingRecords: []
        }),

      resetAll: () =>
        set({
          settings: { ...DEFAULT_SETTINGS, theme: get().settings.theme },
          progress: {},
          mistakes: {},
          daily: {},
          rounds: [],
          study: EMPTY_STUDY,
          customBooks: [],
          listeningDrawn: {},
          listeningMistakes: [],
          writingDrawn: {},
          writingRecords: []
        })
    }),
    {
      name: 'word-master-store',
      version: 1,
      storage: createJSONStorage(pickStorage),
      merge: mergePersistedState,
      // rehydrate 本身不会触发持久化，这里把「归一化之后」的设置写回存档，
      // 否则存档里会长期残留「每轮 30 词但每天只背 20 词」这类非法组合。
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return
        void Promise.resolve().then(() => {
          useAppStore.setState((current) => ({ settings: { ...current.settings } }))
        })
      },
      partialize: (state) => ({
        settings: state.settings,
        progress: state.progress,
        mistakes: state.mistakes,
        daily: state.daily,
        rounds: state.rounds,
        study: state.study,
        customBooks: state.customBooks,
        listeningDrawn: state.listeningDrawn,
        listeningMistakes: state.listeningMistakes,
        writingDrawn: state.writingDrawn,
        writingRecords: state.writingRecords
      })
    }
  )
)

/* ── 选择器与派生数据 ── */

export function todayStat(daily: DailyMap, now = Date.now()): DailyStat {
  return ensureDay(daily, dateKey(now), 0)
}

/** 错题列表（已按错误次数或最近出错时间排序） */
export function mistakeList(bookId: string | 'all', by: 'wrong' | 'recent' = 'wrong') {
  const list = filterMistakes(useAppStore.getState().mistakes, bookId)
  if (by === 'recent') {
    return list.slice().sort((a, b) => b.lastWrongAt - a.lastWrongAt)
  }
  return list.slice().sort((a, b) => b.wrong - a.wrong || b.lastWrongAt - a.lastWrongAt)
}

export function studiedCount(bookId: string): number {
  return countStudied(useAppStore.getState().progress, bookId)
}

export function bookProgress(bookId: string): { studied: number; mastered: number } {
  const { progress } = useAppStore.getState()
  const prefix = `${bookId}:`
  let studied = 0
  let mastered = 0
  for (const [key, value] of Object.entries(progress) as Array<[string, WordProgress]>) {
    if (!key.startsWith(prefix)) continue
    studied += 1
    if (value.mastered) mastered += 1
  }
  return { studied, mastered }
}

/** 导出全部学习数据（用于备份/换设备） */
export function exportBackup(): string {
  const state = useAppStore.getState()
  return JSON.stringify(
    {
      app: 'word-master',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      progress: state.progress,
      mistakes: state.mistakes,
      daily: state.daily,
      rounds: state.rounds,
      study: state.study,
      customBooks: state.customBooks,
      listeningDrawn: state.listeningDrawn,
      listeningMistakes: state.listeningMistakes,
      writingDrawn: state.writingDrawn,
      writingRecords: state.writingRecords
    },
    null,
    2
  )
}

export interface ImportResult {
  ok: boolean
  message: string
}

/** 导入备份：只接受本 App 导出的格式，做基本校验后整体恢复 */
export function importBackup(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, message: '不是合法的 JSON 文件' }
  }

  const data = asRecord(parsed)
  if (data.app !== 'word-master') {
    return { ok: false, message: '这不是「词芽」导出的备份文件' }
  }

  const progress = asRecord(data.progress) as unknown as ProgressMap
  const settingsPatch = asRecord(data.settings) as Partial<Settings>

  useAppStore.setState({
    settings: { ...DEFAULT_SETTINGS, ...settingsPatch },
    progress,
    mistakes: asRecord(data.mistakes) as unknown as MistakeMap,
    daily: asRecord(data.daily) as unknown as DailyMap,
    rounds: Array.isArray(data.rounds) ? (data.rounds as RoundResult[]) : [],
    study: (Object.keys(asRecord(data.study)).length > 0 ? data.study : EMPTY_STUDY) as StudyState,
    customBooks: Array.isArray(data.customBooks) ? (data.customBooks as CustomBook[]) : [],
    listeningDrawn: asRecord(data.listeningDrawn) as Record<string, string[]>,
    listeningMistakes: Array.isArray(data.listeningMistakes) ? (data.listeningMistakes as ListeningMistake[]) : [],
    writingDrawn: asRecord(data.writingDrawn) as Record<string, string[]>,
    writingRecords: Array.isArray(data.writingRecords) ? (data.writingRecords as WritingRecord[]) : []
  })

  return { ok: true, message: `导入成功：${Object.keys(progress).length} 条学习记录已恢复` }
}
