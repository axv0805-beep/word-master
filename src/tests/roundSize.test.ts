import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_ROUND_SIZE,
  MIN_ROUND_SIZE,
  ROUND_SIZE_PRESETS,
  clampRoundSize,
  clampRoundSizeFor,
  isRoundSizePreset,
  maxRoundSizeFor,
  roundSizePresetsFor
} from '../core/constants'
import { DEFAULT_SETTINGS, mergePersistedState, useAppStore } from '../store/appStore'
import { planRound, alphaOrder } from '../core/dictionary'
import type { DictEntry } from '../core/types'

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

describe('每轮单词数：10–30 的取值范围', () => {
  it('常量定义与首页档位一致', () => {
    expect(MIN_ROUND_SIZE).toBe(10)
    expect(MAX_ROUND_SIZE).toBe(30)
    expect(ROUND_SIZE_PRESETS[0]).toBe(MIN_ROUND_SIZE)
    expect(ROUND_SIZE_PRESETS[ROUND_SIZE_PRESETS.length - 1]).toBe(MAX_ROUND_SIZE)
    for (const preset of ROUND_SIZE_PRESETS) expect(isRoundSizePreset(preset)).toBe(true)
  })

  it('低于 10 抬到 10，高于 30 压到 30，中间保留', () => {
    expect(clampRoundSize(1)).toBe(10)
    expect(clampRoundSize(9)).toBe(10)
    expect(clampRoundSize(10)).toBe(10)
    expect(clampRoundSize(18)).toBe(18)
    expect(clampRoundSize(30)).toBe(30)
    expect(clampRoundSize(31)).toBe(30)
    expect(clampRoundSize(999)).toBe(30)
  })

  it('非法输入回退到默认值而不是产生 NaN', () => {
    expect(clampRoundSize(undefined)).toBe(20)
    expect(clampRoundSize(null)).toBe(20)
    expect(clampRoundSize('abc')).toBe(20)
    expect(clampRoundSize(NaN)).toBe(20)
    expect(clampRoundSize(Infinity)).toBe(30)
    expect(clampRoundSize(-Infinity)).toBe(10)
    expect(clampRoundSize('15')).toBe(15)
    expect(clampRoundSize(17.6)).toBe(18)
  })

  it('首页档位之外的旧值在持久化合并时被夹回范围', () => {
    const current = useAppStore.getState()
    expect(mergePersistedState({ settings: { roundSize: 5 } }, current).settings.roundSize).toBe(10)
    expect(mergePersistedState({ settings: { roundSize: 50 } }, current).settings.roundSize).toBe(30)
    expect(mergePersistedState({ settings: { roundSize: 25 } }, current).settings.roundSize).toBe(25)
    expect(mergePersistedState({ settings: {} }, current).settings.roundSize).toBe(DEFAULT_SETTINGS.roundSize)
  })

  it('经 updateSettings 写入时统一夹到范围', () => {
    resetStore()
    useAppStore.getState().updateSettings({ roundSize: 99 })
    expect(useAppStore.getState().settings.roundSize).toBe(30)

    useAppStore.getState().updateSettings({ roundSize: 3 })
    expect(useAppStore.getState().settings.roundSize).toBe(10)

    useAppStore.getState().updateSettings({ roundSize: 25 })
    expect(useAppStore.getState().settings.roundSize).toBe(25)

    // 其它设置不受影响（每日目标会对齐到 5 的倍数）
    useAppStore.getState().updateSettings({ dailyGoal: 65 })
    expect(useAppStore.getState().settings.dailyGoal).toBe(65)
    expect(useAppStore.getState().settings.roundSize).toBe(25)
  })

  it('每一档都能真的生成对应数量的题目', () => {
    const words: DictEntry[] = Array.from({ length: 40 }, (_, index) => ({
      w: `word${`${index}`.padStart(2, '0')}`,
      t: [`释义${index}`]
    }))
    const ordered = alphaOrder(words)
    for (const preset of ROUND_SIZE_PRESETS) {
      const plan = planRound({
        mode: 'alpha',
        ordered,
        cursor: 0,
        size: clampRoundSize(preset),
        shuffle: <T,>(list: readonly T[]) => list.slice()
      })
      expect(plan.words).toHaveLength(preset)
    }
  })

  beforeEach(() => {
    resetStore()
  })
})

describe('每轮单词数随每日目标变化（最低 10，最高 = 每日目标）', () => {
  beforeEach(() => {
    resetStore()
  })

  it('上限 = 每日目标，但仍在 10–30 之间', () => {
    expect(maxRoundSizeFor(5)).toBe(10) // 目标低于下限时不低于 10
    expect(maxRoundSizeFor(10)).toBe(10)
    expect(maxRoundSizeFor(20)).toBe(20)
    expect(maxRoundSizeFor(30)).toBe(30)
    expect(maxRoundSizeFor(50)).toBe(30) // 不超过每轮的绝对上限
    expect(maxRoundSizeFor(300)).toBe(30)
  })

  it('每日目标本身会对齐到 5 的倍数，因此上限总是合法档位', () => {
    // 22 会被对齐成 20，所以上限是 20 而不是 22
    expect(maxRoundSizeFor(22)).toBe(20)
    expect(roundSizePresetsFor(22)).toEqual([10, 15, 20])
    expect(maxRoundSizeFor(17)).toBe(15)
  })

  it('可选档位随目标收缩，最高档不会超过目标', () => {
    expect(roundSizePresetsFor(30)).toEqual([10, 15, 20, 25, 30])
    expect(roundSizePresetsFor(50)).toEqual([10, 15, 20, 25, 30])
    expect(roundSizePresetsFor(20)).toEqual([10, 15, 20])
    expect(roundSizePresetsFor(15)).toEqual([10, 15])
    expect(roundSizePresetsFor(10)).toEqual([10])
    expect(roundSizePresetsFor(5)).toEqual([10])
  })

  it('档位永远是升序且无重复，且都落在 [10, 上限] 内', () => {
    for (const goal of [5, 10, 12, 15, 20, 22, 30, 50, 300]) {
      const list = roundSizePresetsFor(goal)
      expect(list).toEqual([...new Set(list)].sort((a, b) => a - b))
      expect(list[0]).toBeGreaterThanOrEqual(MIN_ROUND_SIZE)
      expect(list[list.length - 1]).toBeLessThanOrEqual(maxRoundSizeFor(goal))
      expect(list.length).toBeGreaterThan(0)
    }
  })

  it('夹取：不超过目标，也不低于 10', () => {
    expect(clampRoundSizeFor(30, 20)).toBe(20)
    expect(clampRoundSizeFor(25, 20)).toBe(20)
    expect(clampRoundSizeFor(20, 20)).toBe(20)
    expect(clampRoundSizeFor(15, 20)).toBe(15)
    expect(clampRoundSizeFor(5, 20)).toBe(10)
    expect(clampRoundSizeFor(30, 5)).toBe(10)
    expect(clampRoundSizeFor(30, 50)).toBe(30)
  })

  it('持久化数据里「每轮超过每日目标」会被归一化', () => {
    const current = useAppStore.getState()
    const merged = mergePersistedState({ settings: { dailyGoal: 20, roundSize: 30 } }, current)
    expect(merged.settings.dailyGoal).toBe(20)
    expect(merged.settings.roundSize).toBe(20)

    const merged2 = mergePersistedState({ settings: { dailyGoal: 100, roundSize: 25 } }, current)
    expect(merged2.settings.roundSize).toBe(25)

    const merged3 = mergePersistedState({ settings: { dailyGoal: 10, roundSize: 30 } }, current)
    expect(merged3.settings.roundSize).toBe(10)
  })

  it('改每日目标时自动夹取每轮单词数（store 层）', () => {
    useAppStore.getState().updateSettings({ dailyGoal: 30, roundSize: 30 })
    expect(useAppStore.getState().settings.roundSize).toBe(30)

    useAppStore.getState().updateSettings({ dailyGoal: 15 })
    expect(useAppStore.getState().settings.roundSize).toBe(15)

    // 目标调大不会自动放大已选值
    useAppStore.getState().updateSettings({ dailyGoal: 100 })
    expect(useAppStore.getState().settings.roundSize).toBe(15)

    // 目标低于下限时落到 10
    useAppStore.getState().updateSettings({ dailyGoal: 5 })
    expect(useAppStore.getState().settings.roundSize).toBe(10)
  })

  it('一次同时改目标与每轮数时，按新目标夹取', () => {
    useAppStore.getState().updateSettings({ dailyGoal: 20, roundSize: 30 })
    expect(useAppStore.getState().settings.dailyGoal).toBe(20)
    expect(useAppStore.getState().settings.roundSize).toBe(20)
  })

  it('完成引导时写入的每轮数同样受目标约束', () => {
    useAppStore.getState().finishOnboarding({ bookId: 'cet4', dailyGoal: 20, roundSize: 30 })
    const settings = useAppStore.getState().settings
    expect(settings.dailyGoal).toBe(20)
    expect(settings.roundSize).toBe(20)
    expect(settings.onboarded).toBe(true)
  })
})
