import { describe, expect, it } from 'vitest'
import {
  GREETING_SLOTS,
  daySeed,
  greetingFor,
  msUntilNextGreetingChange,
  slotDefForHour,
  type GreetingSlot
} from '../core/greeting'

function at(hour: number, minute = 0, day = 15): Date {
  return new Date(2025, 5, day, hour, minute, 0, 0)
}

/** 每个小时的期望时段与问候语前半句 */
const EXPECTED: Array<[number[], GreetingSlot, string]> = [
  [[0, 1, 2, 3, 4], 'latenight', '夜深了'],
  [[5, 6, 7, 8], 'morning', '早上好'],
  [[9, 10, 11], 'forenoon', '上午好'],
  [[12, 13], 'noon', '中午好'],
  [[14, 15, 16], 'afternoon', '下午好'],
  [[17, 18], 'evening', '傍晚好'],
  [[19, 20, 21], 'night', '晚上好'],
  [[22, 23], 'midnight', '夜安']
]

describe('greeting 按时间变化的问候语', () => {
  it('24 小时各自落在正确的时间段，且前半句问候随之改变', () => {
    for (const [hours, slot, hello] of EXPECTED) {
      for (const hour of hours) {
        const greeting = greetingFor(at(hour))
        expect(greeting.slot).toBe(slot)
        expect(greeting.hello).toBe(hello)
      }
    }
  })

  it('后半句叮嘱同样随时间变化（8 个时段两两不同）', () => {
    const remarks = EXPECTED.map(([hours]) => greetingFor(at(hours[0])).remark)
    expect(new Set(remarks).size).toBe(EXPECTED.length)
    for (const remark of remarks) expect(remark.length).toBeGreaterThan(0)
  })

  it('下午 15:30 显示「下午好」而不是「早上好」', () => {
    const greeting = greetingFor(at(15, 30))
    expect(greeting.hello).toBe('下午好')
    expect(greeting.remark).not.toBe('脑子最清醒')
    expect(`${greeting.hello}，${greeting.remark}`).toMatch(/^下午好，/)
  })

  it('时段边界精确切换', () => {
    expect(greetingFor(at(4, 59)).hello).toBe('夜深了')
    expect(greetingFor(at(5, 0)).hello).toBe('早上好')
    expect(greetingFor(at(8, 59)).hello).toBe('早上好')
    expect(greetingFor(at(9, 0)).hello).toBe('上午好')
    expect(greetingFor(at(11, 59)).hello).toBe('上午好')
    expect(greetingFor(at(12, 0)).hello).toBe('中午好')
    expect(greetingFor(at(13, 59)).hello).toBe('中午好')
    expect(greetingFor(at(14, 0)).hello).toBe('下午好')
    expect(greetingFor(at(16, 59)).hello).toBe('下午好')
    expect(greetingFor(at(17, 0)).hello).toBe('傍晚好')
    expect(greetingFor(at(19, 0)).hello).toBe('晚上好')
    expect(greetingFor(at(22, 0)).hello).toBe('夜安')
    expect(greetingFor(at(23, 59)).hello).toBe('夜安')
  })

  it('每个时段的首个说法就是默认文案（早上好，脑子最清醒）', () => {
    expect(GREETING_SLOTS.find((def) => def.slot === 'morning')?.phrases[0]).toEqual({
      hello: '早上好',
      remark: '脑子最清醒'
    })
  })

  it('同一天内文案稳定，跨天会轮换', () => {
    const same = [6, 6, 6].map(() => greetingFor(at(8, 0, 10)).remark)
    expect(new Set(same).size).toBe(1)
    expect(daySeed(at(8, 0, 10))).toBe(daySeed(at(20, 0, 10)))

    const acrossDays = new Set<number>()
    for (let day = 1; day <= 28; day += 1) {
      const def = slotDefForHour(8)
      const index = daySeed(at(8, 0, day)) % def.phrases.length
      acrossDays.add(index)
    }
    expect(acrossDays.size).toBeGreaterThan(1)
  })

  it('返回的 choices 覆盖该时段所有说法', () => {
    for (const def of GREETING_SLOTS) {
      const greeting = greetingFor(at(def.from))
      expect(greeting.choices).toEqual(def.phrases)
      expect(greeting.choices).toContainEqual({ hello: greeting.hello, remark: greeting.remark })
    }
  })

  it('异常小时数不会抛错', () => {
    expect(() => slotDefForHour(24)).not.toThrow()
    expect(slotDefForHour(24).slot).toBe('latenight')
    expect(slotDefForHour(-1).slot).toBe('midnight')
    expect(slotDefForHour(12.7).slot).toBe('noon')
  })

  it('定时刷新：在下个时段分界前触发，且不会返回 0 或负数', () => {
    // 4:59 → 1 分钟后进入早上
    const dawn = at(4, 59)
    expect(msUntilNextGreetingChange(dawn)).toBe(60_000)

    // 8:30 → 30 分钟后进入上午
    expect(msUntilNextGreetingChange(at(8, 30))).toBe(30 * 60_000)

    // 23:10 → 次日 0 点
    expect(msUntilNextGreetingChange(at(23, 10))).toBe(50 * 60_000)

    // 每个整点的返回值都必须是正数且不超过 5 小时
    for (let hour = 0; hour < 24; hour += 1) {
      const delay = msUntilNextGreetingChange(at(hour, 0))
      expect(delay).toBeGreaterThan(0)
      expect(delay).toBeLessThanOrEqual(5 * 60 * 60_000)
    }
  })

  it('刷新时刻正好落在分界点上', () => {
    const now = at(13, 20)
    const next = new Date(now.getTime() + msUntilNextGreetingChange(now))
    expect(next.getHours()).toBe(14)
    expect(next.getMinutes()).toBe(0)
    expect(next.getSeconds()).toBe(0)
    expect(greetingFor(next).hello).toBe('下午好')
    expect(greetingFor(now).hello).toBe('中午好')
  })
})
