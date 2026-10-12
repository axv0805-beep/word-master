import type {
  AnswerResult,
  DictEntry,
  MistakeReplayMode,
  Question,
  QuestionType,
  RoundResult,
  StudyMode
} from './types'
import { buildQuestion, isCorrectAnswer } from './quiz'
import { createRng, randInt, randomSeed, shuffle, type Rng } from './rng'
import { replayGap } from './srs'

export interface RoundEngineConfig {
  /** 本轮首次出现的词 */
  words: DictEntry[]
  /** 抽干扰项用的词池（通常为整本词书） */
  pool: readonly DictEntry[]
  /** 启用的题型 */
  types: QuestionType[]
  /** 错题重现频率策略 */
  replayMode: MistakeReplayMode
  /** interval 模式的 N */
  replayInterval: number
  /** 种子（可复现） */
  seed?: number
  /** 首次出现的词是否打乱顺序 */
  shuffleFirstPass?: boolean
  /** 每题选项数量，默认 4 */
  optionCount?: number
}

/**
 * 一轮练习的调度引擎，负责：
 *   - 按启用的题型逐题出题
 *   - 依据「错题再次出现频率」策略把答错的题重新插入队列
 *   - 累计本轮准确率与错词
 *
 * 同一单词在一轮内最多重现一次，避免队列无限增长。
 */
export class RoundEngine {
  readonly seed: number
  readonly planned: number

  private readonly config: RoundEngineConfig
  private readonly rng: Rng
  private readonly queue: Question[]
  private readonly replayedWords = new Set<string>()
  private readonly firstAttempts = new Map<string, boolean>()
  private readonly wrongDuringRound = new Set<string>()
  private readonly seenWords = new Set<string>()

  private cursor = 0
  private correctCount = 0
  private readonly answers: AnswerResult[] = []
  private startedAt: number

  constructor(config: RoundEngineConfig, now: number = Date.now()) {
    this.config = config
    this.seed = config.seed ?? randomSeed()
    this.rng = createRng(this.seed)
    this.startedAt = now

    const firstPass = config.shuffleFirstPass
      ? shuffle(this.rng, config.words)
      : config.words.slice()
    this.planned = firstPass.length
    this.queue = firstPass.map((entry, index) => this.makeQuestion(entry, index, false))
  }

  private makeQuestion(entry: DictEntry, index: number, replay: boolean): Question {
    const types = this.config.types.length > 0 ? this.config.types : (['zh2en'] as QuestionType[])
    const type = types[randInt(this.rng, types.length)]
    return buildQuestion({
      entry,
      pool: this.config.pool,
      type,
      rng: this.rng,
      index,
      replay,
      optionCount: this.config.optionCount ?? 4
    })
  }

  /** 当前题目；已完成时为 null */
  get current(): Question | null {
    return this.cursor < this.queue.length ? this.queue[this.cursor] : null
  }

  /** 队列中的题目总数（含已插入的错题重现） */
  get total(): number {
    return this.queue.length
  }

  /** 本轮计划首次出现的题目数 */
  get plannedTotal(): number {
    return this.planned
  }

  get answered(): number {
    return this.answers.length
  }

  get correct(): number {
    return this.correctCount
  }

  get accuracy(): number {
    return this.answers.length === 0 ? 0 : this.correctCount / this.answers.length
  }

  get isDone(): boolean {
    return this.cursor >= this.queue.length
  }

  /** 本轮答错过的词（去重） */
  get wrongWords(): string[] {
    return [...this.wrongDuringRound]
  }

  /** 本轮覆盖过的词（去重） */
  get coveredWords(): string[] {
    return [...this.seenWords]
  }

  get results(): readonly AnswerResult[] {
    return this.answers
  }

  /** 提交答案，返回本题结果并推进游标 */
  submit(input: string): AnswerResult {
    const question = this.current
    if (!question) {
      throw new Error('本轮练习已结束，无法继续作答')
    }

    const correct = isCorrectAnswer(question, input)
    const result: AnswerResult = { question, input, correct }
    this.answers.push(result)
    this.seenWords.add(question.entry.w)
    if (correct) this.correctCount += 1
    else this.wrongDuringRound.add(question.entry.w)

    if (!this.firstAttempts.has(question.entry.w)) {
      this.firstAttempts.set(question.entry.w, correct)
    }

    if (!correct && !question.replay) {
      this.scheduleReplay(question)
    }

    this.cursor += 1
    return result
  }

  private scheduleReplay(question: Question): void {
    const word = question.entry.w
    if (this.replayedWords.has(word)) return
    if (this.queue.length >= this.planned * 3 + 10) return
    this.replayedWords.add(word)

    const replay = this.makeQuestion(question.entry, this.queue.length, true)
    const gap = replayGap(this.config.replayMode, this.config.replayInterval)

    if (!Number.isFinite(gap) || gap > this.queue.length) {
      // 轮末集中复习
      this.queue.push(replay)
      return
    }

    const insertAt = Math.min(this.cursor + 1 + gap, this.queue.length)
    this.queue.splice(insertAt, 0, replay)
  }

  /** 首次作答的准确率（不含错题重现的作答） */
  get firstTryAccuracy(): number {
    if (this.firstAttempts.size === 0) return 0
    let correct = 0
    for (const value of this.firstAttempts.values()) if (value) correct += 1
    return correct / this.firstAttempts.size
  }

  /** 结束本轮，产出统计结果 */
  finish(meta: { bookId: string; mode: StudyMode }, now: number = Date.now()): RoundResult {
    return {
      id: `r${this.startedAt}-${this.seed}`,
      bookId: meta.bookId,
      mode: meta.mode,
      seed: this.seed,
      startedAt: this.startedAt,
      endedAt: now,
      answered: this.answers.length,
      planned: this.planned,
      correct: this.correctCount,
      accuracy: this.accuracy,
      firstTryAccuracy: this.firstTryAccuracy,
      durationMs: Math.max(0, now - this.startedAt),
      wrongWords: this.wrongWords,
      words: this.coveredWords
    }
  }
}
