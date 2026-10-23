/**
 * 生成「小学核心词」词书：合并人教版（PEP）小学英语 3–6 年级共 8 册，去重后按首字母排序。
 *
 * 数据来源：开源项目 qwerty-learner 的公开词库（人教版小学英语 PEPXiaoXue*），仅供本地个人学习。
 * 只重建 primary.json 与 manifest 里的这一条，不动其他词书。
 *
 * 用法：node scripts/fetch-primary.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { normalizeDict } from './fetch-dicts.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DICT_DIR = path.join(ROOT, 'public', 'dicts')

const REPO = 'RealKai42/qwerty-learner'
const BRANCH = 'master'

const BOOK_ID = 'primary'
const BOOK_NAME = '小学核心词'
const BOOK_DESC = '人教版小学英语 3–6 年级（8 册合并去重）'

/** 人教版三年级上 → 六年级下，共 8 册 */
const VOLUMES = [
  ['三年级上', 'PEPXiaoXue3_1_T.json'],
  ['三年级下', 'PEPXiaoXue3_2_T.json'],
  ['四年级上', 'PEPXiaoXue4_1_T.json'],
  ['四年级下', 'PEPXiaoXue4_2_T.json'],
  ['五年级上', 'PEPXiaoXue5_1_T.json'],
  ['五年级下', 'PEPXiaoXue5_2_T.json'],
  ['六年级上', 'PEPXiaoXue6_1_T.json'],
  ['六年级下', 'PEPXiaoXue6_2_T.json']
]

const MIRRORS = [
  (p) => `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${p}`,
  (p) => `https://ghproxy.net/https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`,
  (p) => `https://gh-proxy.com/https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`,
  (p) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`
]

async function fetchText(remotePath) {
  const errors = []
  for (const mirror of MIRRORS) {
    const url = mirror(remotePath)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 60000)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (!text.trim().startsWith('[')) throw new Error('返回内容不是 JSON 数组')
      return { text, from: url }
    } catch (err) {
      errors.push(`${url}: ${err.message}`)
    }
  }
  throw new Error(`下载 ${remotePath} 失败：\n  - ${errors.join('\n  - ')}`)
}

function letterStats(words) {
  const letters = {}
  for (const item of words) {
    const letter = String(item.w)[0].toUpperCase()
    letters[letter] = (letters[letter] ?? 0) + 1
  }
  return letters
}

async function main() {
  const raw = []
  const perVolume = []
  let from = ''

  for (const [label, file] of VOLUMES) {
    const { text, from: url } = await fetchText(`public/dicts/${file}`)
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error(`${file} 顶层不是数组`)
    raw.push(...parsed)
    perVolume.push(`${label} ${parsed.length}`)
    if (!from) from = url
    process.stdout.write(`[${label}] ${parsed.length} 条  `)
  }

  const { words, stats } = normalizeDict(raw)
  if (words.length < 200) throw new Error(`小学词书规范化后仅 ${words.length} 条，疑似数据异常`)

  // 按字母、再按词长排序，背起来更顺
  words.sort((a, b) => {
    const wa = a.w.toLowerCase()
    const wb = b.w.toLowerCase()
    return wa < wb ? -1 : wa > wb ? 1 : 0
  })

  const file = `${BOOK_ID}.json`
  const target = path.join(DICT_DIR, file)
  await fs.writeFile(target, JSON.stringify(words), 'utf8')

  const manifestPath = path.join(DICT_DIR, 'manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  const entry = {
    id: BOOK_ID,
    name: BOOK_NAME,
    description: BOOK_DESC,
    file,
    count: words.length,
    rawCount: raw.length,
    expanded: stats.expanded,
    dropped: stats.dropped.slice(0, 20),
    letters: letterStats(words),
    phoneticRate: Number((words.filter((w) => w.us || w.uk).length / words.length).toFixed(4)),
    source: `https://github.com/${REPO}/tree/${BRANCH}/public/dicts`,
    fetchedFrom: from,
    volumes: perVolume
  }

  manifest.books = manifest.books.filter((b) => b.id !== BOOK_ID)
  manifest.books.push(entry)
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(`\n完成：${words.length} 词（合并 ${raw.length} 条，去重 ${raw.length - words.length}）`)
  console.log(`音标覆盖率 ${(entry.phoneticRate * 100).toFixed(1)}%，首字母 ${Object.keys(entry.letters).length} 种`)
  console.log(`已写入 ${path.relative(ROOT, target)}，manifest 现有 ${manifest.books.length} 本词书`)
}

main().catch((err) => {
  console.error('\n生成小学词书失败：', err.message)
  process.exit(1)
})
