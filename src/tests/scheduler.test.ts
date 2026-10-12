import { describe, expect, it } from 'vitest'
import type { DictEntry, MistakeReplayMode } from '../core/types'
import { RoundEngine } from '../core/scheduler'

function pool(size = 40): DictEntry[] {
  return Array.from({ length: size }, (_, i) => ({ w: `word${i}`, t: [`释义${i}`] }))
}

function makeEngine(mode: MistakeReplayMode, interval = 10, size = 10) {
  const words = pool(size)
  return {
    words,
    engine: new RoundEngine({
      words,
      pool: words,
      types: ['zh2en'],
      replayMode: mode,
      replayInterval: interval,
      seed: 20240501,
      shuffleFirstPass: false
    })
  }
}

describe('RoundEngine 轮次调度', () => {
  it('全部答对时题目数等于计划数，准确率为 100%', () => {
    const { engine } = makeEngine('immediate')
    let guard = 0
    while (!engine.isDone && guard < 100) {
      const current = engine.current
      if (!current) break
      engine.submit(current.answer)
      guard += 1
    }
    expect(engine.answered).toBe(10)
    expect(engine.total).toBe(10)
    expect(engine.correct).toBe(10)
    expect(engine.accuracy).toBe(1)
    expect(engine.firstTryAccuracy).toBe(1)
    expect(engine.wrongWords).toHaveLength(0)
  })

  it('答错后按「立即重出」在隔 1 题处插入重现题', () => {
    const { words, engine } = makeEngine('immediate')
    expect(engine.total).toBe(10)

    engine.submit('错误的答案')
    expect(engine.total).toBe(11)
    expect(engine.wrongWords).toEqual([words[0].w])

    // 下一题是原来的第 2 题
    expect(engine.current?.entry.w).toBe(words[1].w)
    engine.submit(engine.current!.answer)

    // 再下一题就是重现的错题
    expect(engine.current?.replay).toBe(true)
    expect(engine.current?.entry.w).toBe(words[0].w)
  })

  it('「每 N 题重现」把错题插到 N 题之后', () => {
    const { words, engine } = makeEngine('interval', 3)
    engine.submit('错误')
    // 之后依次是 word1、word2、word3，然后才是重现的 word0
    const sequence: Array<{ w: string; replay: boolean }> = []
    while (!engine.isDone && sequence.length < 6) {
      const current = engine.current!
      sequence.push({ w: current.entry.w, replay: current.replay })
      engine.submit(current.answer)
    }
    expect(sequence[0].w).toBe(words[1].w)
    expect(sequence[3].w).toBe(words[0].w)
    expect(sequence[3].replay).toBe(true)
  })

  it('「轮末集中复习」把错题放到最后', () => {
    const { words, engine } = makeEngine('endOfRound')
    engine.submit('错误')
    const flags: boolean[] = []
    const wordsSeen: string[] = []
    while (!engine.isDone) {
      const current = engine.current!
      flags.push(current.replay)
      wordsSeen.push(current.entry.w)
      engine.submit(current.answer)
    }
    expect(wordsSeen[wordsSeen.length - 1]).toBe(words[0].w)
    expect(flags[flags.length - 1]).toBe(true)
    expect(flags.slice(0, -1).every((flag) => flag === false)).toBe(true)
  })

  it('「智能间隔」把错题插到第 5 题之后', () => {
    const { words, engine } = makeEngine('srs')
    engine.submit('错误')
    const seq: string[] = []
    while (!engine.isDone && seq.length < 7) {
      const current = engine.current!
      seq.push(current.entry.w)
      engine.submit(current.answer)
    }
    expect(seq[5]).toBe(words[0].w)
  })

  it('同一单词在一轮内最多重现一次，队列不会无限增长', () => {
    const { engine } = makeEngine('immediate')
    let guard = 0
    while (!engine.isDone && guard < 200) {
      engine.submit('一直答错')
      guard += 1
    }
    expect(guard).toBeLessThan(50)
    expect(engine.total).toBe(20) // 10 道首出 + 10 道重现，各只重现一次
    expect(engine.accuracy).toBe(0)
    expect(engine.wrongWords).toHaveLength(10)
  })

  it('首次作答准确率与总体准确率分别统计', () => {
    const { engine } = makeEngine('immediate', 10, 4)
    // 第 1 题答错，其余答对；重现的第 1 题答对
    engine.submit('错误')
    let guard = 0
    while (!engine.isDone && guard < 50) {
      engine.submit(engine.current!.answer)
      guard += 1
    }
    expect(engine.answered).toBe(5)
    expect(engine.correct).toBe(4)
    expect(engine.accuracy).toBeCloseTo(0.8, 5)
    expect(engine.firstTryAccuracy).toBeCloseTo(0.75, 5)
  })

  it('finish 产出完整的一轮统计', () => {
    const { engine } = makeEngine('immediate', 10, 3)
    while (!engine.isDone) engine.submit(engine.current!.answer)
    const result = engine.finish({ bookId: 'cet4', mode: 'alpha' }, Date.now() + 5000)
    expect(result.bookId).toBe('cet4')
    expect(result.mode).toBe('alpha')
    expect(result.seed).toBe(20240501)
    expect(result.answered).toBe(3)
    expect(result.planned).toBe(3)
    expect(result.accuracy).toBe(1)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.words).toHaveLength(3)
  })

  it('首轮顺序可打乱，但集合与计划一致', () => {
    const words = pool(12)
    const engine = new RoundEngine({
      words,
      pool: words,
      types: ['zh2en'],
      replayMode: 'immediate',
      replayInterval: 10,
      seed: 99,
      shuffleFirstPass: true
    })
    const seen = new Set<string>()
    while (!engine.isDone) {
      seen.add(engine.current!.entry.w)
      engine.submit(engine.current!.answer)
    }
    expect(seen.size).toBe(12)
    for (const word of words) expect(seen.has(word.w)).toBe(true)
  })

  it('混合题型时每题都合法', () => {
    const words = pool(50)
    const engine = new RoundEngine({
      words: words.slice(0, 20),
      pool: words,
      types: ['zh2en', 'en2zh', 'listening', 'spelling'],
      replayMode: 'interval',
      replayInterval: 4,
      seed: 7
    })
    let guard = 0
    while (!engine.isDone && guard < 200) {
      const current = engine.current!
      expect(current.answer.length).toBeGreaterThan(0)
      if (current.type !== 'spelling') {
        expect(current.options).toHaveLength(4)
        expect(current.options).toContain(current.answer)
      }
      engine.submit(current.answer)
      guard += 1
    }
    expect(engine.accuracy).toBe(1)
  })

  it('练习结束后再作答会抛出明确错误', () => {
    const { engine } = makeEngine('immediate', 10, 1)
    engine.submit(engine.current!.answer)
    expect(engine.isDone).toBe(true)
    expect(() => engine.submit('x')).toThrowError(/已结束/)
  })
})
