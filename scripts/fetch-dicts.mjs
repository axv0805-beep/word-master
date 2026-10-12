/**
 * 下载并规范化内置词书。
 *
 * 数据来源：开源项目 qwerty-learner (https://github.com/RealKai42/qwerty-learner) 的公开词库，
 * 仅用于本地个人学习。原始条目形如：
 *   { "name": "cancel", "trans": ["取消，撤销； 删去"], "usphone": "'kænsl", "ukphone": "'kænsl" }
 *
 * 输出统一压缩格式，减小体积：
 *   { "w": "cancel", "t": ["取消，撤销； 删去"], "us": "'kænsl", "uk": "'kænsl" }
 *
 * 用法：node scripts/fetch-dicts.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'dicts')

const REPO = 'RealKai42/qwerty-learner'
const BRANCH = 'master'
const RAW_MIRRORS = [
  (p) => `https://ghproxy.net/https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`,
  (p) => `https://gh-proxy.com/https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`,
  (p) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`
]

/** 内置词书清单（与用户确认的范围一致） */
export const BOOKS = [
  {
    id: 'cet4',
    name: '四级核心',
    description: '大学英语四级核心词汇',
    remote: 'public/dicts/CET4_T.json',
    expected: 2607
  },
  {
    id: 'cet6',
    name: '六级',
    description: '大学英语六级词汇',
    remote: 'public/dicts/CET6_T.json',
    expected: 2345
  },
  {
    id: 'gaokao3500',
    name: '高考 3500',
    description: '高考常见词汇 3500',
    remote: 'public/dicts/GaoKao_3500.json',
    expected: null
  },
  {
    id: 'zhongkao',
    name: '中考核心词',
    description: '中考核心词汇',
    remote: 'public/dicts/ZhongKaoHeXin.json',
    expected: null
  }
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithTimeout(url, timeoutMs = 90000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'word-master-dict-fetcher',
        accept: 'application/json,text/plain,*/*'
      }
    })
  } finally {
    clearTimeout(timer)
  }
}

/** 下载原始 JSON 文本，依次尝试镜像，最后回退 GitHub contents API（base64）。 */
async function fetchRawText(remotePath) {
  const errors = []
  for (const mirror of RAW_MIRRORS) {
    const url = mirror(remotePath)
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const res = await fetchWithTimeout(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        if (!text.trim().startsWith('[')) throw new Error('返回内容不是 JSON 数组')
        return { text, from: url }
      } catch (err) {
        errors.push(`${url} (第${attempt}次): ${err.message}`)
        if (attempt === 1) await sleep(1200)
      }
    }
  }

  // 回退：GitHub contents API（返回 base64）
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${remotePath}?ref=${BRANCH}`
  try {
    const res = await fetchWithTimeout(apiUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const payload = await res.json()
    if (!payload.content) throw new Error('contents API 未返回 content 字段')
    const text = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8')
    return { text, from: apiUrl }
  } catch (err) {
    errors.push(`${apiUrl}: ${err.message}`)
  }

  throw new Error(`全部下载方式失败：\n  - ${errors.join('\n  - ')}`)
}

function toTransArray(raw) {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [raw.trim()]
  }
  return []
}

const TOKEN_RE = /^[A-Za-z][A-Za-z'’.-]*$/
const MAX_TOKENS = 4

/** Levenshtein 距离（用于判断两个词条是否属于同一词形族） */
function editDistance(a, b) {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i += 1) {
    const cur = [i]
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[n]
}

function similarity(a, b) {
  const max = Math.max(a.length, b.length)
  return max === 0 ? 1 : 1 - editDistance(a, b) / max
}

/** 所有词条是否属于同一词形族（arise / arose / arisen） */
function isSameWordFamily(tokens) {
  if (tokens.length < 2) return false
  for (let i = 1; i < tokens.length; i += 1) {
    if (similarity(tokens[i - 1], tokens[i]) < 0.5) return false
  }
  return true
}

/**
 * 清洗词条名。原始词书里混有若干非单词形态的写法，直接拿来出题会破坏 4 选 1 与拼写：
 *   "bike = bicycle"                   → bike / bicycle
 *   "grey / gray"                      → grey / gray
 *   "understand understood understood" → understand（词形族折叠为原形）
 *   "ambassador ambassadress"          → ambassador
 *   "mobile phone" / "as soon as"      → 原样保留为短语
 * 返回 0..n 个候选词条名；返回空表示该条目无法清洗，应丢弃并记入报告。
 */
export function cleanWordName(rawName) {
  const candidates = []
  for (const eqPart of String(rawName).split('=')) {
    for (const slashPart of eqPart.split('/')) {
      const text = slashPart.trim().replace(/\s+/g, ' ')
      if (text) candidates.push(text)
    }
  }

  const out = []
  for (const candidate of candidates) {
    const tokens = candidate.split(' ')
    const validToken = (t) => TOKEN_RE.test(t) || t === '&'
    if (tokens.length > MAX_TOKENS || !tokens.every(validToken)) continue
    if (tokens.length > 1 && !tokens.includes('&') && isSameWordFamily(tokens)) {
      out.push(tokens[0])
    } else {
      out.push(candidate)
    }
  }
  return [...new Set(out)]
}

/** 把任意已知词库形状的条目规范化为内部压缩格式，返回 0..n 个词条。 */
export function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return []
  const rawName = String(entry.name ?? entry.word ?? entry.w ?? '').trim()
  if (!rawName) return []
  const t = toTransArray(entry.trans ?? entry.translation ?? entry.t ?? entry.meaning)
  if (t.length === 0) return []

  const names = cleanWordName(rawName)
  if (names.length === 0) return []

  const us = String(entry.usphone ?? entry.us ?? entry.phoneticUs ?? '').trim()
  const uk = String(entry.ukphone ?? entry.uk ?? entry.phoneticUk ?? '').trim()

  return names.map((w) => {
    const out = { w, t }
    if (us) out.us = us
    if (uk) out.uk = uk
    return out
  })
}

export function normalizeDict(rawList) {
  const seen = new Set()
  const out = []
  const stats = { dropped: [], expanded: 0 }
  for (const raw of rawList) {
    const entries = normalizeEntry(raw)
    if (entries.length === 0) {
      const name = String(raw?.name ?? raw?.word ?? '').trim()
      if (name && stats.dropped.length < 50) stats.dropped.push(name)
      continue
    }
    if (entries.length > 1) stats.expanded += 1
    for (const entry of entries) {
      const key = entry.w.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(entry)
    }
  }
  return { words: out, stats }
}

function letterStats(words) {
  const letters = {}
  for (const item of words) {
    const letter = item.w[0].toUpperCase()
    letters[letter] = (letters[letter] ?? 0) + 1
  }
  return letters
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const manifest = []

  for (const book of BOOKS) {
    process.stdout.write(`\n[${book.id}] 下载 ${book.remote} ... `)
    const { text, from } = await fetchRawText(book.remote)
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error(`${book.remote} 顶层不是数组`)

    const { words, stats } = normalizeDict(parsed)
    if (words.length < 50) throw new Error(`${book.id} 规范化后仅 ${words.length} 条，疑似数据异常`)

    const file = `${book.id}.json`
    await fs.writeFile(path.join(OUT_DIR, file), JSON.stringify(words), 'utf8')

    const letters = letterStats(words)
    const withPhone = words.filter((w) => w.us || w.uk).length
    manifest.push({
      id: book.id,
      name: book.name,
      description: book.description,
      file,
      count: words.length,
      rawCount: parsed.length,
      expanded: stats.expanded,
      dropped: stats.dropped,
      letters,
      phoneticRate: Number((withPhone / words.length).toFixed(4)),
      source: `https://github.com/${REPO}/blob/${BRANCH}/${book.remote}`,
      fetchedFrom: from
    })

    const match =
      book.expected == null ? '（无预期值）' : book.expected === words.length ? '✓ 与预期一致' : `✗ 预期 ${book.expected}`
    const extra = []
    if (stats.expanded) extra.push(`展开 ${stats.expanded} 条变体`)
    if (stats.dropped.length) extra.push(`丢弃 ${stats.dropped.length} 条：${stats.dropped.slice(0, 4).join('、')}`)
    console.log(`完成：${words.length} 词 ${match}${extra.length ? '；' + extra.join('；') : ''}`)
  }

  const manifestPath = path.join(OUT_DIR, 'manifest.json')
  const payload = {
    generatedAt: new Date().toISOString(),
    source: `https://github.com/${REPO}`,
    license: '词典数据来自开源项目 qwerty-learner 的公开词库，仅供个人学习使用。',
    books: manifest
  }
  await fs.writeFile(manifestPath, JSON.stringify(payload, null, 2), 'utf8')

  console.log('\n=== 汇总 ===')
  for (const b of manifest) {
    console.log(
      `${b.id.padEnd(12)} ${String(b.count).padStart(5)} 词  音标覆盖率 ${(b.phoneticRate * 100).toFixed(1)}%  首字母种类 ${Object.keys(b.letters).length}`
    )
  }
  console.log(`\nmanifest 已写入 ${path.relative(ROOT, manifestPath)}`)
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  main().catch((err) => {
    console.error('\n词书下载失败：', err.message)
    process.exit(1)
  })
}
