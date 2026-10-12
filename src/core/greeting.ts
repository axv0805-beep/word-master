/**
 * 首页问候语：按本地时间切换，前半句问候、后半句叮嘱都随时间段变化。
 *
 * 纯函数，方便单测；同一个「天」内结果稳定（不会每次渲染都跳字），
 * 不同天会在该时段的几个说法里轮换，避免天天看到同一句。
 */

export type GreetingSlot =
  | 'latenight'
  | 'morning'
  | 'forenoon'
  | 'noon'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'midnight'

export interface GreetingPhrase {
  /** 前半句：问候 */
  hello: string
  /** 后半句：叮嘱（同样随时间变化） */
  remark: string
}

export interface GreetingSlotDef {
  slot: GreetingSlot
  /** 起始小时（含） */
  from: number
  /** 结束小时（不含） */
  to: number
  phrases: GreetingPhrase[]
}

export interface Greeting extends GreetingPhrase {
  slot: GreetingSlot
  /** 该时段的全部说法，便于测试与调试 */
  choices: readonly GreetingPhrase[]
}

/** 时段划分与文案：想改说话风格，只动这张表即可 */
export const GREETING_SLOTS: readonly GreetingSlotDef[] = [
  {
    slot: 'latenight',
    from: 0,
    to: 5,
    phrases: [
      { hello: '夜深了', remark: '别太累，明早再战' },
      { hello: '夜深了', remark: '该休息了，睡饱才记得牢' }
    ]
  },
  {
    slot: 'morning',
    from: 5,
    to: 9,
    phrases: [
      { hello: '早上好', remark: '脑子最清醒' },
      { hello: '早上好', remark: '晨读最见效' }
    ]
  },
  {
    slot: 'forenoon',
    from: 9,
    to: 12,
    phrases: [
      { hello: '上午好', remark: '趁状态正好，来一轮' },
      { hello: '上午好', remark: '记忆黄金期，别浪费' }
    ]
  },
  {
    slot: 'noon',
    from: 12,
    to: 14,
    phrases: [
      { hello: '中午好', remark: '碎片时间也能刷几个词' },
      { hello: '中午好', remark: '饭后小憩，顺手背几个' }
    ]
  },
  {
    slot: 'afternoon',
    from: 14,
    to: 17,
    phrases: [
      { hello: '下午好', remark: '趁热打铁，别断了节奏' },
      { hello: '下午好', remark: '犯困就来几道题醒醒脑' }
    ]
  },
  {
    slot: 'evening',
    from: 17,
    to: 19,
    phrases: [
      { hello: '傍晚好', remark: '饭前刷一波，记得更牢' },
      { hello: '傍晚好', remark: '一天里最轻松的一段' }
    ]
  },
  {
    slot: 'night',
    from: 19,
    to: 22,
    phrases: [
      { hello: '晚上好', remark: '今天的词还记得吗' },
      { hello: '晚上好', remark: '睡前过一遍，记得更牢' }
    ]
  },
  {
    slot: 'midnight',
    from: 22,
    to: 24,
    phrases: [
      { hello: '夜安', remark: '复习完就早点睡' },
      { hello: '夜安', remark: '今天已经比昨天强了' }
    ]
  }
]

/** 所有时段的分界小时（0 点由跨日分支处理） */
export const GREETING_BOUNDARIES: readonly number[] = GREETING_SLOTS.slice(1).map((def) => def.from)

/** 某小时属于哪个时段 */
export function slotDefForHour(hour: number): GreetingSlotDef {
  const normalized = ((Math.floor(hour) % 24) + 24) % 24
  const found = GREETING_SLOTS.find((def) => normalized >= def.from && normalized < def.to)
  return found ?? GREETING_SLOTS[GREETING_SLOTS.length - 1]
}

/** 以「天」为种子：同一天内稳定，跨天轮换 */
export function daySeed(date: Date): number {
  return date.getFullYear() * 1000 + (date.getMonth() + 1) * 40 + date.getDate()
}

/** 给定时刻的问候语 */
export function greetingFor(date: Date): Greeting {
  const def = slotDefForHour(date.getHours())
  const phrase = def.phrases[daySeed(date) % def.phrases.length]
  return { slot: def.slot, hello: phrase.hello, remark: phrase.remark, choices: def.phrases }
}

/** 距离下次问候语变化还有多少毫秒（用于定时刷新） */
export function msUntilNextGreetingChange(date: Date): number {
  const hour = date.getHours()
  const nextBoundary = GREETING_BOUNDARIES.find((boundary) => boundary > hour)

  const next = new Date(date)
  if (nextBoundary == null) {
    next.setDate(next.getDate() + 1)
    next.setHours(0, 0, 0, 0)
  } else {
    next.setHours(nextBoundary, 0, 0, 0)
  }

  const delta = next.getTime() - date.getTime()
  // 兜底：时钟异常/DST 跳变时不要出现 0 或负延迟导致死循环
  return delta > 1000 ? delta : 60_000
}
