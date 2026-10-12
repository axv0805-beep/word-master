import { beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { DictEntry } from '../core/types'
import { RoundEngine } from '../core/scheduler'
import { countMastered } from '../core/mistakes'
import { dateKey } from '../core/stats'
import { DEFAULT_SETTINGS, exportBackup, importBackup, mergePersistedState, useAppStore } from '../store/appStore'

function loadCet4Sample(count = 24): DictEntry[] {
  const file = path.resolve(__dirname, '../../public/dicts/cet4.json')
  const all = JSON.parse(fs.readFileSync(file, 'utf8')) as DictEntry[]
  return all.slice(0, count)
}

function resetStore() {
  useAppStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    progress: {},
    mistakes: {},
    daily: {},
    rounds: [],
    study: { alphaCursor: {}, lastLetter: {} },
    customBooks: []
  })
}

/** 跑完一轮：把 wrongWords 里的词故意答错，其余答对，并同步写入 store */
function runRound(
  words: DictEntry[],
  wrongWords: Set<string>,
  options: { clearStreak?: number; replayMode?: 'immediate' | 'interval' | 'endOfRound' | 'srs' } = {}
) {
  if (options.clearStreak != null) {
    useAppStore.getState().updateSettings({ mistakeClearStreak: options.clearStreak })
  }

  const engine = new RoundEngine({
    words,
    pool: words,
    types: ['zh2en'],
    replayMode: options.replayMode ?? 'immediate',
    replayInterval: 10,
    seed: 12345,
    shuffleFirstPass: false
  })

  let guard = 0
  while (!engine.isDone && guard < 500) {
    const current = engine.current!
    const input = wrongWords.has(current.entry.w) ? '###错误###' : current.answer
    const result = engine.submit(input)
    useAppStore.getState().recordAnswer('cet4', result.question.entry, result.correct, input)
    guard += 1
  }

  const finished = engine.finish({ bookId: 'cet4', mode: 'alpha' })
  useAppStore.getState().completeRound(finished)
  return finished
}

describe('端到端流程：答题 → 错题本 → 统计 → 备份', () => {
  beforeEach(() => {
    resetStore()
  })

  it('一轮练习后错题本、单词进度、每日统计、轮次历史都被正确写入', () => {
    const words = loadCet4Sample(20)
    const wrong = new Set([words[0].w, words[5].w, words[9].w])
    const result = runRound(words, wrong)

    const state = useAppStore.getState()

    // 错题本：三个错词都在，且错误次数 >= 1
    expect(Object.keys(state.mistakes)).toHaveLength(3)
    for (const word of wrong) {
      const entry = state.mistakes[`cet4:${word}`]
      expect(entry).toBeDefined()
      expect(entry.wrong).toBeGreaterThanOrEqual(1)
    }

    // 单词进度：20 个词都有记录，答对的词连对不再为 0
    expect(Object.keys(state.progress)).toHaveLength(20)
    for (const word of words) {
      const progress = state.progress[`cet4:${word.w}`]
      expect(progress).toBeDefined()
      if (wrong.has(word.w)) {
        expect(progress.wrong).toBeGreaterThanOrEqual(1)
        expect(progress.streak).toBe(0)
      } else {
        expect(progress.correct).toBeGreaterThanOrEqual(1)
      }
    }

    // 每日统计：题目数与本轮作答数一致，准确率可回算
    const today = state.daily[dateKey(Date.now())]
    expect(today).toBeDefined()
    expect(today.questions).toBe(result.answered)
    expect(today.rounds).toBe(1)
    expect(today.correct).toBe(result.correct)

    // 轮次历史
    expect(state.rounds).toHaveLength(1)
    expect(state.rounds[0].wrongWords.sort()).toEqual([...wrong].sort())
  })

  it('连续两轮答对同一个词后会被标记为掌握，并从错题本移除', () => {
    const words = loadCet4Sample(12)
    const wrong = new Set([words[0].w])

    runRound(words, wrong)
    expect(useAppStore.getState().mistakes[`cet4:${words[0].w}`]).toBeDefined()

    // 第二轮：同一个词答对一次，连对 2 次（含上一轮结束时的 0 + 本轮 1）→ 仍未掌握
    runRound(words, new Set())
    let progress = useAppStore.getState().progress[`cet4:${words[0].w}`]
    expect(progress.streak).toBeGreaterThanOrEqual(1)

    // 第三轮继续全对，连对达到阈值 2 → 掌握并移出错题本
    runRound(words, new Set())
    progress = useAppStore.getState().progress[`cet4:${words[0].w}`]
    expect(progress.mastered).toBe(true)
    expect(useAppStore.getState().mistakes[`cet4:${words[0].w}`]).toBeUndefined()
    expect(countMastered(useAppStore.getState().progress)).toBeGreaterThan(0)
  })

  it('错题本为空时仍可正常完成一轮（没有错题重现插入）', () => {
    const words = loadCet4Sample(8)
    const result = runRound(words, new Set())
    expect(result.answered).toBe(8)
    expect(result.accuracy).toBe(1)
    expect(Object.keys(useAppStore.getState().mistakes)).toHaveLength(0)
  })

  it('导出备份再导入可以完整还原学习数据', () => {
    const words = loadCet4Sample(10)
    runRound(words, new Set([words[2].w]))

    const before = useAppStore.getState()
    const progressCount = Object.keys(before.progress).length
    const mistakeCount = Object.keys(before.mistakes).length
    const backup = exportBackup()

    resetStore()
    expect(Object.keys(useAppStore.getState().progress)).toHaveLength(0)

    const outcome = importBackup(backup)
    expect(outcome.ok).toBe(true)

    const after = useAppStore.getState()
    expect(Object.keys(after.progress)).toHaveLength(progressCount)
    expect(Object.keys(after.mistakes)).toHaveLength(mistakeCount)
    expect(after.rounds).toHaveLength(1)
  })

  it('导入非本应用的 JSON 会被拒绝且不破坏现有数据', () => {
    const words = loadCet4Sample(6)
    runRound(words, new Set())
    const progressCount = Object.keys(useAppStore.getState().progress).length

    const bad = importBackup(JSON.stringify({ app: 'other-app', progress: {} }))
    expect(bad.ok).toBe(false)
    expect(Object.keys(useAppStore.getState().progress)).toHaveLength(progressCount)

    const broken = importBackup('{ 不是 json')
    expect(broken.ok).toBe(false)
  })

  it('重置进度不会清掉设置', () => {
    const words = loadCet4Sample(6)
    runRound(words, new Set())
    useAppStore.getState().updateSettings({ roundSize: 25, dailyGoal: 65 })
    useAppStore.getState().resetProgress()

    const state = useAppStore.getState()
    expect(Object.keys(state.progress)).toHaveLength(0)
    expect(Object.keys(state.daily)).toHaveLength(0)
    expect(state.settings.roundSize).toBe(25)
    expect(state.settings.dailyGoal).toBe(65)
  })

  it('字母顺序游标推进后可以从上次位置继续', () => {
    const words = loadCet4Sample(30)
    const first = words.slice(0, 10)
    runRound(first, new Set())

    useAppStore.getState().setAlphaCursor('cet4', 10)
    const cursor = useAppStore.getState().study.alphaCursor.cet4
    expect(cursor).toBe(10)

    const nextBatch = words.slice(cursor, cursor + 10)
    expect(nextBatch[0].w).toBe(words[10].w)
  })
})

describe('本地存储残缺数据的容错（mergePersistedState）', () => {
  it('持久化数据里缺失的设置项会回退到默认值，而不是变成 undefined', () => {
    const current = useAppStore.getState()
    const merged = mergePersistedState(
      // 模拟旧版本留下的数据：settings 只有两个字段
      { settings: { theme: 'dark', questionTypes: ['zh2en'] } },
      current
    )

    expect(merged.settings.theme).toBe('dark')
    expect(merged.settings.questionTypes).toEqual(['zh2en'])
    // 关键：这些字段没有被写成 undefined
    expect(merged.settings.dailyGoal).toBe(DEFAULT_SETTINGS.dailyGoal)
    expect(merged.settings.bookId).toBe(DEFAULT_SETTINGS.bookId)
    expect(merged.settings.roundSize).toBe(DEFAULT_SETTINGS.roundSize)
    expect(merged.settings.mistakeReplayMode).toBe(DEFAULT_SETTINGS.mistakeReplayMode)
    expect(merged.settings.mistakeReplayInterval).toBe(DEFAULT_SETTINGS.mistakeReplayInterval)
    expect(merged.settings.mistakeClearStreak).toBe(DEFAULT_SETTINGS.mistakeClearStreak)
    expect(merged.settings.accent).toBe(DEFAULT_SETTINGS.accent)
  })

  it('完全没有持久化数据时使用默认值', () => {
    const merged = mergePersistedState(undefined, useAppStore.getState())
    expect(merged.settings).toEqual(DEFAULT_SETTINGS)
    expect(merged.progress).toEqual({})
    expect(merged.mistakes).toEqual({})
    expect(merged.daily).toEqual({})
    expect(merged.rounds).toEqual([])
    expect(merged.study).toEqual({ alphaCursor: {}, lastLetter: {} })
  })

  it('字段类型损坏时不会崩溃', () => {
    const merged = mergePersistedState(
      { settings: 'not-an-object', progress: null, mistakes: 42, daily: [], rounds: 'x', study: null, customBooks: {} },
      useAppStore.getState()
    )
    expect(merged.settings).toEqual(DEFAULT_SETTINGS)
    expect(merged.progress).toEqual({})
    expect(merged.mistakes).toEqual({})
    expect(merged.daily).toEqual({})
    expect(merged.rounds).toEqual([])
    expect(merged.study).toEqual({ alphaCursor: {}, lastLetter: {} })
    expect(merged.customBooks).toEqual([])
  })

  it('残缺的 study 字段也能补全，游标数据保留', () => {
    const merged = mergePersistedState({ study: { alphaCursor: { cet4: 25 } } }, useAppStore.getState())
    expect(merged.study.alphaCursor).toEqual({ cet4: 25 })
    expect(merged.study.lastLetter).toEqual({})
  })
})
