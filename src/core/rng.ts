/** 可复现的伪随机数发生器：同一 seed 必然产生同一套题，便于复现与测试。 */

export type Rng = () => number

/** mulberry32 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 生成一个随机整数 seed */
export function randomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
}

/** 返回 [0, max) 的整数 */
export function randInt(rng: Rng, max: number): number {
  if (max <= 0) return 0
  return Math.floor(rng() * max) % max
}

/** Fisher–Yates 洗牌（返回新数组） */
export function shuffle<T>(rng: Rng, list: readonly T[]): T[] {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randInt(rng, i + 1)
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

/** 从数组中随机取一个元素 */
export function pick<T>(rng: Rng, list: readonly T[]): T | undefined {
  if (list.length === 0) return undefined
  return list[randInt(rng, list.length)]
}
