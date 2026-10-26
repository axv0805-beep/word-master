/**
 * 听力训练的类型与题库注册表。
 * 一个 item = 一段材料 + 一道题：按「听一段、答一题」组织，
 * 这样专项训练和真题模拟共用同一个播放器与判分逻辑。
 */

export type ListeningLevel = 'cet4' | 'cet6'
export type ListeningMode = 'drill' | 'mock'

/** M = 男声，W = 女声，N = 旁白/短文朗读 */
export type ListeningSpeaker = 'M' | 'W' | 'N'

export interface ListeningLine {
  speaker: ListeningSpeaker
  text: string
}

export interface ListeningItem {
  id: string
  level: ListeningLevel
  mode: ListeningMode
  /** 材料类型，用来在界面上标一行小字：短对话 / 长对话 / 短文 / 新闻 */
  section: string
  material: ListeningLine[]
  stem: string
  options: string[]
  /** 正确选项下标 */
  answer: number
  /** 中文解析 */
  explain: string
  /** 整段材料的中文大意，答题后展开 */
  summary: string
}

export interface ListeningSet {
  level: ListeningLevel
  mode: ListeningMode
  title: string
  /** 一句话说明：几道题、大约多久 */
  caption: string
  items: ListeningItem[]
}

export const LEVEL_LABEL: Record<ListeningLevel, string> = {
  cet4: '四级',
  cet6: '六级'
}

export const MODE_LABEL: Record<ListeningMode, string> = {
  drill: '专项训练',
  mock: '真题模拟'
}

/** 每种题型大致要花多久：材料按语速 150 词/分、每题再留 25 秒作答 */
export function estimateMinutes(items: ListeningItem[]): number {
  const words = items.reduce(
    (sum, item) => sum + item.material.reduce((count, line) => count + line.text.split(/\s+/).length, 0),
    0
  )
  return Math.max(1, Math.round((words / 150 + (items.length * 25) / 60) * 1))
}

/** 分类页上的一行说明：告诉用户这套题的节奏更像什么 */
export function gradeHint(level: ListeningLevel, mode: ListeningMode): string {
  return mode === 'drill'
    ? `一段材料一道题，节奏跟${LEVEL_LABEL[level]}短对话一致`
    : `材料长度贴近${LEVEL_LABEL[level]}真题，一次做完更接近考场`
}
