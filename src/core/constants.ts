/**
 * 每轮单词数的取值范围与快捷档位。
 * 首页快捷选择与设置页滑块共用这一份定义，避免两处边界不一致。
 */
export const MIN_ROUND_SIZE = 10
export const MAX_ROUND_SIZE = 30
export const ROUND_SIZE_STEP = 5

/** 首页快捷档位（覆盖 10–30 全部整五档） */
export const ROUND_SIZE_PRESETS: readonly number[] = [10, 15, 20, 25, 30]

/**
 * 把任意输入夹到 [10, 30]。
 *
 * - 数字字符串（如 '15'）会被识别
 * - Infinity / -Infinity 视为「极大 / 极小」，夹到上限 / 下限
 * - 真正无法解析的值（NaN、null、''、'abc'）回退到 fallback
 */
export function clampRoundSize(value: unknown, fallback = 20): number {
  let num: number
  if (typeof value === 'number') num = value
  else if (typeof value === 'string' && value.trim() !== '') num = Number(value)
  else return fallback

  if (Number.isNaN(num)) return fallback
  if (num === Number.POSITIVE_INFINITY) return MAX_ROUND_SIZE
  if (num === Number.NEGATIVE_INFINITY) return MIN_ROUND_SIZE

  return Math.min(MAX_ROUND_SIZE, Math.max(MIN_ROUND_SIZE, Math.round(num)))
}

/** 该值是否是首页可高亮的档位 */
export function isRoundSizePreset(value: number): boolean {
  return ROUND_SIZE_PRESETS.includes(value)
}

/** 每日目标的范围与快捷档位 */
export const MIN_DAILY_GOAL = 5
export const MAX_DAILY_GOAL = 300
export const DAILY_GOAL_PRESETS: readonly number[] = [10, 20, 30, 50, 100]

/** 把任意输入夹到 [5, 300] */
export function clampDailyGoal(value: unknown, fallback = 30): number {
  let num: number
  if (typeof value === 'number') num = value
  else if (typeof value === 'string' && value.trim() !== '') num = Number(value)
  else return fallback

  if (Number.isNaN(num)) return fallback
  if (num === Number.POSITIVE_INFINITY) return MAX_DAILY_GOAL
  if (num === Number.NEGATIVE_INFINITY) return MIN_DAILY_GOAL

  // 每日目标按 5 的整数倍对齐，避免出现 33 这种读起来别扭的值
  const aligned = Math.round(num / 5) * 5
  return Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, aligned))
}

/**
 * 每轮单词数的上限：不超过每日目标，同时仍受 10–30 的绝对范围约束。
 *
 * 例：目标 50 → 30（绝对上限）；目标 20 → 20；目标 12 → 12；目标 5 → 10（不能低于下限）。
 */
export function maxRoundSizeFor(dailyGoal: unknown): number {
  const goal = clampDailyGoal(dailyGoal)
  return Math.max(MIN_ROUND_SIZE, Math.min(MAX_ROUND_SIZE, goal))
}

/**
 * 当前每日目标下可选的每轮单词数档位。
 * 若上限不是整五档（例如目标 22），就把上限本身也作为一个档位，保证「最高 = 目标」。
 */
export function roundSizePresetsFor(dailyGoal: unknown): number[] {
  const max = maxRoundSizeFor(dailyGoal)
  const list = ROUND_SIZE_PRESETS.filter((value) => value <= max)
  if (!list.includes(max)) list.push(max)
  return [...new Set(list)].sort((a, b) => a - b)
}

/** 在「每日目标」的约束下夹取每轮单词数 */
export function clampRoundSizeFor(value: unknown, dailyGoal: unknown, fallback = 20): number {
  const max = maxRoundSizeFor(dailyGoal)
  const base = clampRoundSize(value, fallback)
  return Math.min(max, Math.max(MIN_ROUND_SIZE, base))
}
