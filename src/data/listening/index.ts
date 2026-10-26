import { CET4_DRILL, CET4_MOCK } from './cet4'
import { CET6_DRILL, CET6_MOCK } from './cet6'
import { LEVEL_LABEL, MODE_LABEL, estimateMinutes, type ListeningItem, type ListeningLevel, type ListeningMode, type ListeningSet } from '../../core/listening'

/**
 * 题库注册表：页面只按 level + mode 取一套，不关心具体素材怎么排。
 * 素材是原创仿真的，见 cet4.ts / cet6.ts 顶部说明。
 */

const SETS: Record<ListeningLevel, Record<ListeningMode, ListeningItem[]>> = {
  cet4: { drill: CET4_DRILL, mock: CET4_MOCK },
  cet6: { drill: CET6_DRILL, mock: CET6_MOCK }
}

export function getListeningSet(level: ListeningLevel, mode: ListeningMode): ListeningSet {
  const items = SETS[level]?.[mode] ?? []
  const minutes = estimateMinutes(items)
  return {
    level,
    mode,
    title: `${LEVEL_LABEL[level]}听力 · ${MODE_LABEL[mode]}`,
    caption: `${items.length} 道题 · 约 ${minutes} 分钟`,
    items
  }
}

/** 首页/分类页用来展示每套题的题量与时长 */
export function listListeningSets(): ListeningSet[] {
  const levels: ListeningLevel[] = ['cet4', 'cet6']
  const modes: ListeningMode[] = ['drill', 'mock']
  return levels.flatMap((level) => modes.map((mode) => getListeningSet(level, mode)))
}

export function isListeningLevel(value: string | undefined): value is ListeningLevel {
  return value === 'cet4' || value === 'cet6'
}

export function isListeningMode(value: string | undefined): value is ListeningMode {
  return value === 'drill' || value === 'mock'
}
