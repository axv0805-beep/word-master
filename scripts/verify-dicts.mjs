/**
 * 内置词书数据校验（验收脚本）。用法：node scripts/verify-dicts.mjs
 *
 * 硬性检查（失败即退出码 1）：
 *   - manifest.json 存在且格式正确
 *   - 每本词书文件存在、可解析、顶层是数组
 *   - count 与 manifest 一致
 *   - 每个词条 w 非空、符合英文单词形态；t 为非空字符串数组
 *   - 同一本词书内无重复单词（忽略大小写）
 *   - 首字母分布与 manifest 记录一致
 *
 * 软性报告（不失败，仅提示）：
 *   - 音标覆盖率、首字母覆盖情况、疑似异常词条（如过短/超长、释义过多）
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DICT_DIR = path.join(ROOT, 'public', 'dicts')

/**
 * 词条形态：允许单词、带连字符/撇号的词，以及短语（如 "mobile phone"、"Lost & Found"）。
 * 这是合理的词书内容，不是错误；多词词条只做提示。
 * 注意：'=' 与 '/' 形式的变体组应在 fetch-dicts 阶段展开，出现即视为数据未清洗。
 */
const WORD_RE = /^[A-Za-z][A-Za-z'’.-]*(?: (?:[A-Za-z][A-Za-z'’.-]*|&))*$/
const MAX_LEN = 40
const MAX_TOKENS = 4
const problems = []
const warnings = []
const phraseEntries = []

function fail(message) {
  problems.push(message)
}

function warn(message) {
  warnings.push(message)
}

function letterStats(words) {
  const letters = {}
  for (const item of words) {
    const letter = String(item.w)[0].toUpperCase()
    letters[letter] = (letters[letter] ?? 0) + 1
  }
  return letters
}

function sameLetters(a, b) {
  const ka = Object.keys(a).sort()
  const kb = Object.keys(b).sort()
  if (ka.length !== kb.length) return false
  return ka.every((key, i) => key === kb[i] && a[key] === b[key])
}

async function main() {
  let manifest
  try {
    manifest = JSON.parse(await fs.readFile(path.join(DICT_DIR, 'manifest.json'), 'utf8'))
  } catch (err) {
    console.error(`✗ 无法读取 manifest.json：${err.message}`)
    process.exit(1)
  }

  if (!Array.isArray(manifest.books) || manifest.books.length === 0) {
    console.error('✗ manifest.books 缺失或为空')
    process.exit(1)
  }

  let grandTotal = 0
  const rows = []

  for (const book of manifest.books) {
    const filePath = path.join(DICT_DIR, book.file)
    let words
    try {
      words = JSON.parse(await fs.readFile(filePath, 'utf8'))
    } catch (err) {
      fail(`[${book.id}] 无法读取 ${book.file}：${err.message}`)
      continue
    }

    if (!Array.isArray(words)) {
      fail(`[${book.id}] ${book.file} 顶层不是数组`)
      continue
    }
    if (words.length !== book.count) {
      fail(`[${book.id}] 词条数 ${words.length} 与 manifest 记录 ${book.count} 不一致`)
    }

    const seen = new Map()
    let emptyTrans = 0
    let badName = 0
    let badTrans = 0
    let phonetics = 0
    let longest = { w: '', len: 0 }
    let multiToken = 0

    for (const [index, entry] of words.entries()) {
      const w = entry?.w
      if (typeof w !== 'string' || !w.trim()) {
        badName += 1
        fail(`[${book.id}] 第 ${index} 条单词为空或非字符串`)
        continue
      }
      const tokens = w.trim().split(/\s+/)
      if (/[=/]/.test(w)) {
        badName += 1
        fail(`[${book.id}] 第 ${index} 条未清洗的变体写法：${JSON.stringify(w)}`)
      } else if (!WORD_RE.test(w) || w.length > MAX_LEN || tokens.length > MAX_TOKENS) {
        badName += 1
        fail(`[${book.id}] 第 ${index} 条词条形态异常：${JSON.stringify(w)}`)
      }
      if (tokens.length > 1) {
        multiToken += 1
        if (phraseEntries.length < 200) phraseEntries.push(`${book.id}:${w}`)
      }
      if (!Array.isArray(entry.t) || entry.t.length === 0) {
        emptyTrans += 1
      } else if (entry.t.some((s) => typeof s !== 'string' || !s.trim())) {
        badTrans += 1
      }
      if (entry.us || entry.uk) phonetics += 1
      if (w.length > longest.len) longest = { w, len: w.length }

      const key = w.toLowerCase()
      if (seen.has(key)) {
        fail(`[${book.id}] 重复单词：${w}（第 ${seen.get(key)} 与第 ${index} 条）`)
      } else {
        seen.set(key, index)
      }
    }

    if (emptyTrans > 0) fail(`[${book.id}] 有 ${emptyTrans} 条释义为空`)
    if (badTrans > 0) fail(`[${book.id}] 有 ${badTrans} 条释义含非字符串或空白项`)

    const letters = letterStats(words)
    if (!sameLetters(letters, book.letters ?? {})) {
      fail(`[${book.id}] 首字母分布与 manifest 不一致`)
    }
    const missing = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split('')
      .filter((letter) => !letters[letter])
    if (missing.length > 0) {
      warn(`[${book.id}] 缺少首字母：${missing.join('')}`)
    }

    const rate = words.length ? phonetics / words.length : 0
    if (rate < 0.9) warn(`[${book.id}] 音标覆盖率偏低：${(rate * 100).toFixed(1)}%`)
    if (words.length < 100) warn(`[${book.id}] 词条数偏少：${words.length}`)
    if (longest.len > 24) warn(`[${book.id}] 存在超长词条：${longest.w}（${longest.len} 字符）`)
    if (multiToken > 0) warn(`[${book.id}] 含 ${multiToken} 条多词词条（短语/词形族，属正常词书内容）`)

    grandTotal += words.length
    rows.push({
      id: book.id,
      name: book.name,
      count: words.length,
      phoneticRate: `${(rate * 100).toFixed(1)}%`,
      letters: Object.keys(letters).length,
      multiToken
    })
  }

  console.log('词书校验报告')
  console.log('─'.repeat(80))
  console.log(
    ['词书', 'ID', '词条数', '音标覆盖', '首字母', '多词词条']
      .map((h, i) => h.padEnd([16, 14, 8, 10, 8, 8][i]))
      .join('')
  )
  for (const row of rows) {
    console.log(
      [
        row.name.padEnd(16),
        row.id.padEnd(14),
        String(row.count).padEnd(8),
        row.phoneticRate.padEnd(10),
        String(row.letters).padEnd(8),
        String(row.multiToken).padEnd(8)
      ].join('')
    )
  }
  console.log('─'.repeat(80))
  console.log(`合计 ${rows.length} 本词书，${grandTotal} 个词条`)
  if (phraseEntries.length) {
    console.log(`多词词条示例：${phraseEntries.slice(0, 6).join(' / ')}`)
  }

  if (warnings.length) {
    console.log('\n提示（不影响通过）：')
    for (const w of warnings) console.log(`  · ${w}`)
  }

  if (problems.length) {
    console.error(`\n✗ 校验失败，共 ${problems.length} 个问题：`)
    for (const p of problems) console.error(`  · ${p}`)
    process.exit(1)
  }

  console.log('\n✓ 词书校验全部通过')
}

main().catch((err) => {
  console.error('校验脚本异常：', err)
  process.exit(1)
})
