/**
 * 本地作文批改引擎。
 * 没有后端、也不联网：拼写靠内置词库 + 编辑距离，语法靠一组「低误报」规则，
 * 打分是内容 / 结构 / 语言三块的加权，理由按实际扣分项生成。
 */

import type { WritingTask } from './writing'
import { wordCount } from './writing'

export type IssueKind = 'spelling' | 'grammar' | 'style'

export interface WritingIssue {
  kind: IssueKind
  /** 出问题的原文片段 */
  excerpt: string
  /** 中文说明：错在哪 */
  message: string
  /** 建议改法 */
  suggestion?: string
}

export interface WritingBreakdown {
  content: number
  structure: number
  language: number
}

export interface WritingGrade {
  /** 百分制 */
  score: number
  /** 等级文案 */
  band: string
  /** 换算到四六级 106.5 分制 */
  cetScore: number
  breakdown: WritingBreakdown
  issues: WritingIssue[]
  comments: string[]
  stats: {
    words: number
    sentences: number
    paragraphs: number
    avgSentence: number
    uniqueRatio: number
  }
}

/** 高频功能词与常见词：词书里不会收录，但写作一定会用到 */
const COMMON_WORDS = `the a an and or but if because so while when where which that this these those
of to in on at for with from by as into over under between among through during without within about after before
against along around behind below beside beyond except inside near off onto out outside past since toward until upon
is are was were be been being am do does did done doing have has had having will would can could shall should may might must
not no yes very too also just only even still yet again ever never always often sometimes usually rarely
i me my mine myself you your yours yourself he him his himself she her hers herself it its itself we us our ours ourselves they them their theirs themselves
who whom whose what when where why how there here then than such both each every all any some many much few little more most less least other another same different own
today tomorrow yesterday now soon later once twice first second third last next
people person someone anyone everyone nobody man woman men women child children boy girl student students teacher teachers
friend friends family home house room car bus train phone phones computer internet email
time times year years day days week weeks month months hour hours minute minutes morning afternoon evening night
world life work school city country water food money book books news paper papers
good bad new old big small long short high low right wrong sure able
cannot oneself oneself nowadays anymore anyway however therefore moreover furthermore besides
except perhaps maybe almost already enough quite rather really simply usually actually finally
answer question problem idea way thing things part place case point fact reason result example
read reading write writing speak speaking listen listening study learning learn teach teaching
help support improve change become start finish continue try need want wish hope like love enjoy
think know believe feel find get give take make use keep put let see look watch hear listen
homework lesson class course exam test practice exercise skill skills habit habits
volunteer volunteers community society government country city village people public private
important difficult easy helpful useful necessary possible impossible popular common special
excellent important difficult easy happy sad tired busy free full empty early late fast slow strong weak
get got give gave take took come came go went make made find found think thought know knew see saw say said tell told ask asked
feel felt become became begin began start started stop stopped keep kept put put run ran walk walked read read write wrote
speak spoke listen listened watch watched play played live lived love loved hate hated use used try tried show showed
change changed grow grew open opened close closed buy bought sell sold pay paid cost cost spend spent save saved
lose lost win won meet met visit visited travel travelled eat ate drink drank sleep slept wake woke sit sat stand stood
move moved carry carried bring brought send sent receive received answer answered explain explained describe described
discuss discussed decide decided choose chose agree agreed believe believed hope hoped wish wished remember remembered
forget forgot understand understood mean meant happen happened seem seemed appear appeared remain remained stay stayed
leave left arrive arrived return returned follow followed lead led join joined share shared compare compared
improve improved develop developed increase increased decrease decreased reduce reduced provide provided offer offered
allow allowed require required avoid avoided include included contain contained cover covered reach reached
finish finished complete completed continue continued prepare prepared support supported accept accepted refuse refused
promise promised suggest suggested recommend recommended consider considered expect expected notice noticed realize realised
repeat repeated practice practise correct corrected mistake mistakes reason reasons result results effect effects cause causes
problem problems solution suggestions idea ideas opinion opinions example examples fact facts point points part parts
place places area areas group groups member members team teams company companies business businesses government public
service services system systems rule rules law laws plan plans project projects report reports event events activity activities
culture history science technology environment energy climate nature animal animals plant plants tree trees river rivers
sea mountain mountains weather summer winter spring autumn exam exams test tests score scores grade grades class classes lesson lessons
homework library dormitory canteen campus university college job jobs career salary customer customers market markets
don't doesn't didn't isn't aren't wasn't weren't can't couldn't won't wouldn't shouldn't mustn't haven't hasn't hadn't
i'm i've i'd i'll you're you've you'll he's she's it's we're they're that's there's let's`
  .split(/\s+/)
  .filter(Boolean)

const COMMON_SET = new Set(COMMON_WORDS)

/** 常见拼写错误直接给出结果，剩下的交给编辑距离 */
const KNOWN_FIXES: Record<string, string> = {
  goverment: 'government',
  enviroment: 'environment',
  enviromental: 'environmental',
  recieve: 'receive',
  seperate: 'separate',
  definately: 'definitely',
  occured: 'occurred',
  untill: 'until',
  becouse: 'because',
  alot: 'a lot',
  infact: 'in fact',
  everyday: 'every day',
  advices: 'advice',
  informations: 'information',
  equipments: 'equipment',
  knowledges: 'knowledge',
  peoples: 'people',
  childs: 'children',
  womens: 'women',
  mens: 'men',
  thier: 'their',
  teh: 'the',
  studing: 'studying',
  writting: 'writing',
  begining: 'beginning',
  sucess: 'success',
  succesful: 'successful',
  oppurtunity: 'opportunity',
  inteligent: 'intelligent',
  comunication: 'communication',
  developement: 'development',
  achivement: 'achievement',
  benifit: 'benefit',
  responsability: 'responsibility',
  necesary: 'necessary',
  accomodation: 'accommodation',
  embarass: 'embarrass',
  calender: 'calendar',
  grammer: 'grammar',
  libary: 'library',
  scolarship: 'scholarship'
}

const PROPER_NOUNS = [
  'english',
  'chinese',
  'china',
  'america',
  'american',
  'britain',
  'british',
  'europe',
  'european',
  'asia',
  'asian',
  'africa',
  'african',
  'japan',
  'japanese',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'january',
  'february',
  'march',
  'april',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'christmas',
  'spring festival'
]

/** a / an 的例外：拼写以元音开头但读辅音，或反之 */
const AN_EXCEPTIONS = ['university', 'useful', 'user', 'usual', 'uniform', 'union', 'unique', 'united', 'european', 'one', 'once']
const A_EXCEPTIONS = ['hour', 'honest', 'honour', 'honor', 'mba', 'x-ray']

const CONNECTIVES = [
  'however',
  'therefore',
  'moreover',
  'furthermore',
  'besides',
  'in addition',
  'what is more',
  'on the other hand',
  'in contrast',
  'as a result',
  'for example',
  'for instance',
  'first',
  'second',
  'finally',
  'meanwhile',
  'although',
  'whereas'
]

const CONCLUSION_MARKERS = ['in conclusion', 'to sum up', 'to conclude', 'in short', 'all in all', 'in a word']

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
}

function tokenize(text: string): string[] {
  const matched = text.match(/[A-Za-z][A-Za-z'’-]*/g)
  return matched ? matched : []
}

function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/^['’-]+|['’]+$/g, '').replace(/’/g, "'")
}

function withoutPossessive(word: string): string {
  return word.replace(/'s$/, '').replace(/s'$/, 's')
}

/** 判断一个词是不是「词库里认得」：原形、常见屈折、或常见词表 */
function isKnown(word: string, dict: Set<string>): boolean {
  if (COMMON_SET.has(word)) return true
  if (dict.has(word)) return true
  const stems = [word]
  if (word.endsWith('ies')) stems.push(`${word.slice(0, -3)}y`)
  if (word.endsWith('es')) stems.push(word.slice(0, -2))
  if (word.endsWith('s')) stems.push(word.slice(0, -1))
  if (word.endsWith('ed')) {
    stems.push(word.slice(0, -2), word.slice(0, -1))
    if (word.endsWith('ied')) stems.push(`${word.slice(0, -3)}y`)
    if (/([a-z])\1ed$/.test(word)) stems.push(word.slice(0, -3))
  }
  if (word.endsWith('ing')) {
    stems.push(word.slice(0, -3), `${word.slice(0, -3)}e`)
    if (/([a-z])\1ing$/.test(word)) stems.push(word.slice(0, -4))
  }
  if (word.endsWith('ly')) stems.push(word.slice(0, -2))
  if (word.endsWith('er')) stems.push(word.slice(0, -2), word.slice(0, -1))
  if (word.endsWith('est')) stems.push(word.slice(0, -3))
  if (word.endsWith('ily')) stems.push(`${word.slice(0, -3)}y`)
  if (word.endsWith('ier')) stems.push(`${word.slice(0, -3)}y`)
  if (word.endsWith('iest')) stems.push(`${word.slice(0, -4)}y`)
  return stems.some((stem) => stem.length > 1 && (COMMON_SET.has(stem) || dict.has(stem)))
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 2) return 3
  const prev = new Array<number>(b.length + 1)
  const curr = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j += 1) prev[j] = j
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j]
  }
  return prev[b.length]
}

/** 在词库里找最像的一个词；找不到就返回 null（宁可漏报，不误报） */
function closestWord(word: string, dict: Set<string>): string | null {
  // 短词放宽编辑距离会产生大量误报（cannot → canon），所以 ≤7 个字母只认 1
  const limit = word.length <= 7 ? 1 : 2
  let best: string | null = null
  let bestDistance = limit + 1
  const first = word[0]
  for (const candidate of dict) {
    if (candidate[0] !== first) continue
    if (Math.abs(candidate.length - word.length) > 2) continue
    const distance = editDistance(word, candidate)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
      if (distance === 1) break
    }
  }
  return bestDistance <= limit ? best : null
}

function contextSentence(text: string, word: string): string {
  const lower = text.toLowerCase()
  const index = lower.indexOf(word.toLowerCase())
  if (index < 0) return word
  const isBoundary = (char: string) => char === '.' || char === '!' || char === '?' || char === String.fromCharCode(10)
  let start = index
  while (start > 0 && !isBoundary(text[start - 1])) start -= 1
  let end = index + word.length
  while (end < text.length && !isBoundary(text[end])) end += 1
  if (end < text.length) end += 1
  const sentence = text.slice(start, end).replace(/\s+/g, ' ').trim()
  return sentence.length > 96 ? `${sentence.slice(0, 96).trimEnd()}…` : sentence
}

function buildIssue(list: WritingIssue[], issue: WritingIssue): void {
  if (list.some((item) => item.kind === issue.kind && item.excerpt === issue.excerpt && item.message === issue.message)) {
    return
  }
  list.push(issue)
}

interface GradeOptions {
  /** 拼写词库（词书所有词条的小写原型 + 常见词） */
  dictionary?: Set<string>
}

export function gradeEssay(text: string, task: WritingTask, options: GradeOptions = {}): WritingGrade {
  const dict = options.dictionary ?? new Set<string>()
  const issues: WritingIssue[] = []
  const sentences = splitSentences(text)
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
  const words = tokenize(text)
  const lower = text.toLowerCase()

  // ---------- 拼写 ----------
  const seenMisspelling = new Set<string>()
  for (const raw of words) {
    const word = normalizeWord(withoutPossessive(raw))
    if (word.length < 4 || /\d/.test(word)) continue
    if (isKnown(word, dict)) continue
    if (seenMisspelling.has(word)) continue
    seenMisspelling.add(word)
    const fixed = KNOWN_FIXES[word]
    if (fixed) {
      buildIssue(issues, {
        kind: 'spelling',
        excerpt: contextSentence(text, raw),
        message: `“${raw}” 拼写有误`,
        suggestion: fixed
      })
      continue
    }
    if (dict.size === 0) continue
    const candidate = closestWord(word, dict)
    if (candidate) {
      buildIssue(issues, {
        kind: 'spelling',
        excerpt: contextSentence(text, raw),
        message: `“${raw}” 可能是拼写错误`,
        suggestion: candidate
      })
    }
  }

  // ---------- 语法 ----------
  for (const sentence of sentences) {
    const firstChar = sentence.match(/[A-Za-z]/)
    if (firstChar) {
      const index = sentence.indexOf(firstChar[0])
      const char = firstChar[0]
      if (char === char.toLowerCase()) {
        buildIssue(issues, {
          kind: 'grammar',
          excerpt: sentence.slice(index, index + 28),
          message: '句首单词首字母没有大写',
          suggestion: char.toUpperCase() + sentence.slice(index + 1, index + 20)
        })
      }
    }
  }

  if (/(^|[^A-Za-z])i([^A-Za-z]|$)/.test(text)) {
    const match = text.match(/(^|[^A-Za-z])i([^A-Za-z]|$)/)
    if (match) {
      buildIssue(issues, {
        kind: 'grammar',
        excerpt: 'i',
        message: '人称代词 I 必须大写',
        suggestion: 'I'
      })
    }
  }

  for (const match of text.matchAll(/\ba\s+([A-Za-z]+)/g)) {
    const next = match[1].toLowerCase()
    if (!/^[aeiou]/.test(next)) continue
    if (AN_EXCEPTIONS.includes(next)) continue
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: `元音开头的词前面应该用 an`,
      suggestion: `an ${match[1]}`
    })
  }
  for (const match of text.matchAll(/\ban\s+([A-Za-z]+)/g)) {
    const next = match[1].toLowerCase()
    if (/^[aeiou]/.test(next)) continue
    if (A_EXCEPTIONS.includes(next)) continue
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: `辅音开头的词前面应该用 a`,
      suggestion: `a ${match[1]}`
    })
  }

  for (const match of text.matchAll(/[A-Za-z][,;:](?=[A-Za-z])/g)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: '标点后面缺少空格',
      suggestion: `${match[0][0]}${match[0][1]} `
    })
  }

  if (/ {2,}/.test(text)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: '连续空格',
      message: '出现了多余的空格'
    })
  }

  for (const match of text.matchAll(/\b([A-Za-z]{2,})\s+\1\b/gi)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: '同一个词连续出现了两次'
    })
  }

  for (const name of PROPER_NOUNS) {
    if (name.includes(' ')) continue
    const lowerName = name
    if (lower.includes(` ${lowerName}`) || lower.startsWith(`${lowerName} `)) {
      const original = text.match(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i'))
      if (original && original[0] === lowerName) {
        buildIssue(issues, {
          kind: 'grammar',
          excerpt: original[0],
          message: `专有名词需要大写`,
          suggestion: name[0].toUpperCase() + name.slice(1)
        })
      }
    }
  }

  for (const match of text.matchAll(/\b(he|she|it)\s+don't\b/gi)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: '第三人称单数应与 doesn’t 搭配',
      suggestion: `${match[1]} doesn’t`
    })
  }
  for (const match of text.matchAll(/\b(they|we|you)\s+is\b/gi)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: '主语是复数，be 动词应该用 are',
      suggestion: `${match[1]} are`
    })
  }
  for (const match of text.matchAll(/\b(they|we)\s+was\b/gi)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: '主语是复数，过去式应该用 were',
      suggestion: `${match[1]} were`
    })
  }
  for (const match of text.matchAll(/\b(can|could|should|must|may|might|will|would)\s+to\b/gi)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: '情态动词后面直接跟动词原形，不加 to',
      suggestion: match[1]
    })
  }
  for (const match of text.matchAll(/\bthere\s+(have|has)\b/gi)) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: match[0],
      message: '「某地有……」应该用 there is / there are',
      suggestion: 'there is / there are'
    })
  }

  for (const sentence of sentences) {
    const low = sentence.toLowerCase()
    if (low.includes('although') && low.includes('but')) {
      buildIssue(issues, {
        kind: 'grammar',
        excerpt: sentence.slice(0, 32),
        message: 'although 与 but 不能同时出现在一个句子里',
        suggestion: '二选一：留 although，去掉 but'
      })
    }
    if (low.includes('because') && low.includes(', so ')) {
      buildIssue(issues, {
        kind: 'grammar',
        excerpt: sentence.slice(0, 32),
        message: 'because 与 so 不能同时出现在一个句子里',
        suggestion: '二选一：because 后面直接接结果，或去掉 because 用 so'
      })
    }
  }

  if (text.trim().length > 0 && !/[.!?]\s*$/.test(text.trim())) {
    buildIssue(issues, {
      kind: 'grammar',
      excerpt: text.trim().slice(-24),
      message: '全文结尾缺少句号等结束标点'
    })
  }

  // ---------- 表达 ----------
  if (/in my opinion,?\s+i (think|believe)/i.test(text)) {
    buildIssue(issues, {
      kind: 'style',
      excerpt: 'In my opinion, I think',
      message: '观点句式重复，in my opinion 与 I think 保留一个就够'
    })
  }
  const veryCount = (lower.match(/\bvery\b/g) ?? []).length
  if (veryCount >= 3) {
    buildIssue(issues, {
      kind: 'style',
      excerpt: `very × ${veryCount}`,
      message: 'very 用得偏多，可以换成更准确的形容词（如 extremely / particularly / fairly）'
    })
  }
  for (const sentence of sentences) {
    const count = wordCount(sentence)
    if (count > 40) {
      buildIssue(issues, {
        kind: 'style',
        excerpt: sentence.slice(0, 28),
        message: `这一句有 ${count} 个词，建议拆成两句`
      })
    }
  }
  if (sentences.length >= 3 && new Set(sentences.map((s) => s.split(/\s+/)[0].toLowerCase())).size === 1) {
    buildIssue(issues, {
      kind: 'style',
      excerpt: sentences[0].slice(0, 20),
      message: '多句都以同一个词开头，句式单调，可以换用分词短语或状语前置'
    })
  }

  // ---------- 分项打分 ----------
  const total = words.length
  const [minWords, maxWords] = task.wordRange
  const wordScore =
    total < minWords * 0.6
      ? 4
      : total < minWords
        ? 8
        : total <= maxWords * 1.25
          ? 14
          : 11

  const topicWords = task.title
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !['that', 'with', 'from', 'this', 'your', 'their'].includes(word))
  const covered = topicWords.filter((word) => lower.includes(word)).length
  const ideaScore = topicWords.length === 0 ? 8 : Math.min(14, 6 + Math.round((covered / topicWords.length) * 8))
  const content = Math.min(30, wordScore + ideaScore + (sentences.length >= 4 ? 2 : 0))

  const paragraphCount = Math.max(paragraphs.length, sentences.length > 0 ? 1 : 0)
  const paragraphScore = paragraphCount >= 3 ? 8 : paragraphCount === 2 ? 5 : 2
  const connectiveCount = CONNECTIVES.filter((word) => lower.includes(word)).length
  const connectiveScore = connectiveCount >= 3 ? 7 : connectiveCount >= 2 ? 5 : connectiveCount === 1 ? 3 : 0
  const hasConclusion = CONCLUSION_MARKERS.some((word) => lower.includes(word))
  const conclusionScore = hasConclusion ? 5 : paragraphCount >= 3 ? 2 : 0
  const structure = Math.min(20, paragraphScore + connectiveScore + conclusionScore)

  const grammarIssues = issues.filter((issue) => issue.kind === 'grammar').length
  const spellingIssues = issues.filter((issue) => issue.kind === 'spelling').length
  const uniqueRatio = total === 0 ? 0 : new Set(words.map((word) => normalizeWord(word))).size / total
  const vocabBonus = uniqueRatio >= 0.62 ? 4 : uniqueRatio >= 0.5 ? 2 : 0
  const language = Math.max(
    0,
    Math.min(50, 40 + vocabBonus - Math.min(24, grammarIssues * 3) - Math.min(12, spellingIssues * 2))
  )

  const score = Math.max(0, Math.min(100, Math.round(content + structure + language)))
  const band = score >= 85 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '合格' : '待提高'

  // ---------- 评语 ----------
  const comments: string[] = []
  if (total < minWords) {
    comments.push(`目前写了 ${total} 词，题目建议 ${minWords}–${maxWords} 词，篇幅不足会直接影响内容分。`)
  } else if (total > maxWords * 1.25) {
    comments.push(`写了 ${total} 词，超出建议的 ${maxWords} 词较多，考场上要留出检查时间。`)
  } else {
    comments.push(`篇幅 ${total} 词，落在建议的 ${minWords}–${maxWords} 词区间，符合要求。`)
  }

  if (paragraphCount < 3) {
    comments.push(`全文只有 ${paragraphCount} 段，建议按「引入—展开—收尾」分成三段以上，阅卷时更清楚。`)
  } else {
    comments.push(`分了 ${paragraphCount} 段，结构清楚。`)
  }

  if (connectiveCount < 2) {
    comments.push('段落之间几乎没用连接词，可以补 however / therefore / what is more 这类过渡，让逻辑更连贯。')
  } else {
    comments.push(`用到了 ${connectiveCount} 处连接表达，前后衔接自然。`)
  }

  if (grammarIssues === 0 && spellingIssues === 0) {
    comments.push('没有查出明显的语法与拼写问题，可以再把用词往具体、准确的方向打磨。')
  } else {
    comments.push(
      `查出 ${grammarIssues} 处语法问题、${spellingIssues} 处拼写问题，改掉这些细节能明显提分。`
    )
  }

  return {
    score,
    band,
    cetScore: Math.round((score / 100) * 106.5),
    breakdown: { content, structure, language },
    issues,
    comments,
    stats: {
      words: total,
      sentences: sentences.length,
      paragraphs: paragraphCount,
      avgSentence: sentences.length === 0 ? 0 : Math.round((total / sentences.length) * 10) / 10,
      uniqueRatio: Math.round(uniqueRatio * 100) / 100
    }
  }
}

/** 从词条列表里建拼写词库 */
export function buildSpellDictionary(headwords: readonly string[]): Set<string> {
  const set = new Set<string>()
  for (const word of headwords) {
    const normalized = normalizeWord(word)
    if (normalized.length > 1) set.add(normalized)
  }
  return set
}
