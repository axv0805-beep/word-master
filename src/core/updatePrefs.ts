/**
 * 「进入应用后弹窗提醒更新」的节奏控制。
 *
 * 目标：有新版时别只在设置页里藏着，进来就提醒一次；但也不能每次冷启动都弹。
 * 规则：
 *   - 自动检查最多每 6 小时一次（cold start 才算，热启动不会重复查）
 *   - 点「稍后再说」→ 6 小时内不再打扰
 *   - 点「跳过这个版本」→ 这个 versionCode 以后都不再提醒（更高的版本照常提醒）
 *
 * 存在 localStorage 里，和设置一起清空（恢复出厂设置的 resetAll 会清掉整个 store，
 * 这份独立 key 也算过期数据，读不到就当作从未检查过）。
 */

/** 两次自动检查之间的最短间隔 */
export const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
/** 点「稍后再说」之后静默多久 */
export const SNOOZE_INTERVAL_MS = 6 * 60 * 60 * 1000

const STORAGE_KEY = 'word-master:update-prefs'

export interface UpdatePrefs {
  /** 上次自动检查的时间戳（ms） */
  lastCheckAt: number
  /** 静默到这个时间点之前不再弹窗（ms） */
  snoozeUntil: number
  /** 用户选择跳过的版本号；大于它的版本照常提醒 */
  mutedVersionCode: number
}

const EMPTY_PREFS: UpdatePrefs = { lastCheckAt: 0, snoozeUntil: 0, mutedVersionCode: 0 }

function toNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num > 0 ? num : 0
}

export function readUpdatePrefs(): UpdatePrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_PREFS }
    const parsed = JSON.parse(raw) as Partial<UpdatePrefs> | null
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_PREFS }
    return {
      lastCheckAt: toNumber(parsed.lastCheckAt),
      snoozeUntil: toNumber(parsed.snoozeUntil),
      mutedVersionCode: toNumber(parsed.mutedVersionCode)
    }
  } catch {
    // 隐私模式 / 存储被禁用：当作第一次启动，功能不受影响，只是记不住
    return { ...EMPTY_PREFS }
  }
}

export function writeUpdatePrefs(patch: Partial<UpdatePrefs>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readUpdatePrefs(), ...patch }))
  } catch {
    /* 写不进去就只影响「下次还提不提醒」，不阻断更新本身 */
  }
}

/** 这次冷启动要不要自动查一次更新 */
export function shouldCheckOnLaunch(now = Date.now()): boolean {
  const prefs = readUpdatePrefs()
  if (now < prefs.snoozeUntil) return false
  return now - prefs.lastCheckAt >= CHECK_INTERVAL_MS
}

/** 记下这次已经查过（无论有没有新版），避免反复请求 version.json */
export function markChecked(now = Date.now()): void {
  writeUpdatePrefs({ lastCheckAt: now })
}

/** 「稍后再说」：关掉弹窗，并把自动检查推迟一个静默周期 */
export function snoozeUpdatePrompt(now = Date.now()): void {
  writeUpdatePrefs({ lastCheckAt: now, snoozeUntil: now + SNOOZE_INTERVAL_MS })
}

/** 「跳过这个版本」：以后不再为这个版本弹窗 */
export function muteUpdateVersion(versionCode: number): void {
  writeUpdatePrefs({ mutedVersionCode: Math.max(0, Math.floor(versionCode)) })
}

export function isVersionMuted(versionCode: number): boolean {
  return readUpdatePrefs().mutedVersionCode >= versionCode
}

/** 测试用：抹掉记忆，回到「第一次启动」 */
export function resetUpdatePrefs(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 同上 */
  }
}
