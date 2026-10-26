import { CET4_DRILL } from './cet4-drill'
import { CET4_MOCK } from './cet4-mock'
import { CET6_DRILL } from './cet6-drill'
import { CET6_MOCK } from './cet6-mock'
import { LEVEL_LABEL, MODE_LABEL, estimateMinutes, type ListeningItem, type ListeningLevel, type ListeningMode, type ListeningSet } from '../../core/listening'

/**
 * 题库注册表：专项训练用「题库题」，真题模拟用「往年真题场次的仿真题」。
 * 四个文件各 26 题，共 104 题。素材是原创仿真的，见各文件顶部说明。
 */

const SETS: Record<ListeningLevel, Record<ListeningMode, ListeningItem[]>> = {
  cet4: { drill: CET4_DRILL, mock: CET4_MOCK },
  cet6: { drill: CET6_DRILL, mock: CET6_MOCK }
}

/** 每轮抽几道题 */
export const ROUND_SIZE = 6

export function getListeningPool(level: ListeningLevel, mode: ListeningMode): ListeningItem[] {
  return SETS[level]?.[mode] ?? []
}

export function getListeningSet(level: ListeningLevel, mode: ListeningMode): ListeningSet {
  const items = getListeningPool(level, mode)
  return {
    level,
    mode,
    title: `${LEVEL_LABEL[level]}听力 · ${MODE_LABEL[mode]}`,
    caption: `题库 ${items.length} 道题 · 每轮随机 ${ROUND_SIZE} 道`,
    items
  }
}

/** 分类页/选练方式页用到的元信息，不返回整份题库 */
export interface ListeningPoolInfo {
  level: ListeningLevel
  mode: ListeningMode
  total: number
  roundSize: number
  /** 一轮大概要多久（按 6 题算） */
  minutes: number
}

export function getListeningPoolInfo(level: ListeningLevel, mode: ListeningMode): ListeningPoolInfo {
  const items = getListeningPool(level, mode)
  const perRound = Math.min(ROUND_SIZE, items.length)
  return {
    level,
    mode,
    total: items.length,
    roundSize: ROUND_SIZE,
    minutes: estimateMinutes(items.slice(0, perRound))
  }
}

export function listListeningPools(): ListeningPoolInfo[] {
  const levels: ListeningLevel[] = ['cet4', 'cet6']
  const modes: ListeningMode[] = ['drill', 'mock']
  return levels.flatMap((level) => modes.map((mode) => getListeningPoolInfo(level, mode)))
}

export interface ListeningRound {
  items: ListeningItem[]
  /** 本轮抽中的题号，交给 store 记账 */
  ids: string[]
  /** 题库已被抽完、这一轮是从头重新开始抽的 */
  restarted: boolean
}

/**
 * 抽一轮题：优先从「还没抽过」的题里随机取 6 道；
 * 剩下的不够 6 道时说明整库已经抽完，清空记账从头开始，并把 restarted 标出来。
 * 随机性只放在这里，页面与测试都可以用固定的 drawn 列表复现。
 */
export function pickListeningRound(
  level: ListeningLevel,
  mode: ListeningMode,
  drawn: string[] = [],
  roundSize = ROUND_SIZE
): ListeningRound {
  const pool = getListeningPool(level, mode)
  if (pool.length === 0) return { items: [], ids: [], restarted: false }

  const drawnSet = new Set(drawn)
  const fresh = pool.filter((item) => !drawnSet.has(item.id))
  const restarted = fresh.length < roundSize && drawnSet.size > 0
  const source = restarted ? pool : fresh

  const picked = shuffle(source).slice(0, Math.min(roundSize, source.length))
  return { items: picked, ids: picked.map((item) => item.id), restarted }
}

/** 同一场训练里再抽一轮时，把上一轮的题号并进去 */
export function mergeDrawn(previous: string[], next: string[], poolSize: number, restarted: boolean): string[] {
  if (restarted) return next
  const merged = Array.from(new Set([...previous, ...next]))
  return merged.length > poolSize ? next : merged
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function isListeningLevel(value: string | undefined): value is ListeningLevel {
  return value === 'cet4' || value === 'cet6'
}

export function isListeningMode(value: string | undefined): value is ListeningMode {
  return value === 'drill' || value === 'mock'
}
