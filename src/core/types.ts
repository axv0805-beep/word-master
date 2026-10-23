/** 全局类型定义 */

/** 词条（内置词书的压缩格式；多词条目如 "mobile phone" 也合法） */
export interface DictEntry {
  /** 单词或短语 */
  w: string
  /** 中文释义（可能多条，分别对应不同词性） */
  t: string[]
  /** 美式音标 */
  us?: string
  /** 英式音标 */
  uk?: string
}

/** 词书元数据（来自 public/dicts/manifest.json） */
export interface BookMeta {
  id: string
  name: string
  description: string
  file: string
  count: number
  letters: Record<string, number>
  phoneticRate: number
  source: string
}

export interface Manifest {
  generatedAt: string
  source: string
  license: string
  books: BookMeta[]
}

/** 题型：看图外的四类练习方式 */
export type QuestionType =
  /** 给中文意思 → 英文 4 选 1 */
  | 'zh2en'
  /** 给英文 → 中文 4 选 1 */
  | 'en2zh'
  /** 听发音 → 选中文意思 */
  | 'listening'
  /** 给中文 → 拼写英文 */
  | 'spelling'

/** 学习模式 */
export type StudyMode =
  /** 按字母顺序背单词（可选起始字母） */
  | 'alpha'
  /** 随机抽取单词 */
  | 'random'
  /** 错题专项练习 */
  | 'mistakes'

/** 错题再次出现频率策略 */
export type MistakeReplayMode =
  /** 立即重出：答错后隔 1 题再问一次 */
  | 'immediate'
  /** 每 N 题重现 */
  | 'interval'
  /** 轮末集中复习 */
  | 'endOfRound'
  /** 智能间隔（简化 SM-2，跨轮按天安排） */
  | 'srs'

/** 主题 ID：3 套深色 + 3 套浅色，具体色值见 src/index.css */
export type ThemeId = 'dark' | 'light' | 'aurora' | 'sakura' | 'sunset' | 'ocean'

export interface Settings {
  bookId: string
  /** 每一轮题目数量 */
  roundSize: number
  /** 启用的题型（多选） */
  questionTypes: QuestionType[]
  /** 错题重现频率 */
  mistakeReplayMode: MistakeReplayMode
  /** interval 模式下的 N（题） */
  mistakeReplayInterval: number
  /** 连续答对几次后移出错题本 */
  mistakeClearStreak: number
  /** 答题时自动朗读 */
  autoSpeak: boolean
  /** 发音口音 */
  accent: 'us' | 'uk'
  /** 优先使用在线真人发音（失败回退系统语音） */
  onlineAudio: boolean
  dailyGoal: number
  theme: ThemeId
  /** 拼写题是否显示音标提示 */
  showPhoneticInSpelling: boolean
  /** 是否已完成首次引导（选词书 + 定每日目标） */
  onboarded: boolean
}

/** 单个词条的学习进度 */
export interface WordProgress {
  /** 连续答对次数 */
  streak: number
  /** 累计答对次数 */
  correct: number
  /** 累计答错次数 */
  wrong: number
  /** 是否已掌握（连续答对达到阈值） */
  mastered: boolean
  lastSeenAt: number
  /** SRS：难度因子 */
  ef: number
  /** SRS：当前间隔（天） */
  intervalDays: number
  /** SRS：下次到期时间戳（ms） */
  dueAt: number
}

/** 错题本条目 */
export interface MistakeEntry {
  /** `${bookId}:${word}` */
  key: string
  bookId: string
  word: string
  trans: string[]
  us?: string
  uk?: string
  /** 累计答错次数 */
  wrong: number
  /** 最近一次答错时用户输入的答案 */
  lastWrongInput?: string
  lastWrongAt: number
  /** 上一次做对后的累计答对数，用于判断移出错题本 */
  correctStreak: number
}

/** 一道题 */
export interface Question {
  id: string
  type: QuestionType
  entry: DictEntry
  /** 题干文本（listening 题为空，因为题干是音频） */
  prompt: string
  /** 4 选 1 选项（spelling 题为 undefined） */
  options?: string[]
  /** 正确答案文本 */
  answer: string
  /** 是否由错题重现插入 */
  replay: boolean
}

/** 单题作答结果 */
export interface AnswerResult {
  question: Question
  /** 用户作答（选项文本或拼写输入） */
  input: string
  correct: boolean
}

/** 一轮练习的统计结果 */
export interface RoundResult {
  id: string
  bookId: string
  mode: StudyMode
  seed: number
  startedAt: number
  endedAt: number
  /** 本轮总作答次数（含错题重现） */
  answered: number
  /** 首次出现的题目数 */
  planned: number
  correct: number
  /** 准确率 = correct / answered */
  accuracy: number
  firstTryAccuracy: number
  durationMs: number
  /** 本轮答错的词（去重） */
  wrongWords: string[]
  /** 本轮覆盖的词（去重） */
  words: string[]
}

/** 每日练习痕迹 */
export interface DailyStat {
  /** YYYY-MM-DD */
  date: string
  questions: number
  correct: number
  rounds: number
  ms: number
  /** 当日结束时的累计掌握词数（用于成长曲线） */
  mastered: number
}

/** 成就徽章 */
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  /** 解锁进度 0..1 */
  progress: number
}

export interface StudyState {
  /** 每本书「按字母顺序」学习到的位置：bookId → 已完成的词条序号 */
  alphaCursor: Record<string, number>
  /** 每本书上次选中的起始字母 */
  lastLetter: Record<string, string>
}
