import type { DictEntry } from './types'

function toTransArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((item) => String(item).trim()).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/[;；|]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function entryFrom(row: Record<string, unknown>): DictEntry | null {
  const w = String(row.w ?? row.word ?? row.name ?? row.term ?? '').trim()
  if (!w) return null
  const t = toTransArray(row.t ?? row.trans ?? row.meaning ?? row.translation ?? row.cn ?? row.zh)
  if (t.length === 0) return null
  const entry: DictEntry = { w, t }
  const us = String(row.us ?? row.usphone ?? '').trim()
  const uk = String(row.uk ?? row.ukphone ?? '').trim()
  if (us) entry.us = us
  if (uk) entry.uk = uk
  return entry
}

/** 解析 CSV / TSV 文本（第一行若是表头会自动跳过） */
export function parseDelimited(text: string): DictEntry[] {
  const lines = text.split(/\r?\n/)
  const out: DictEntry[] = []
  const seen = new Set<string>()

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    let cells: string[]
    if (line.includes('\t')) cells = line.split('\t')
    else if (line.includes(',')) cells = line.split(',')
    else if (line.includes(';')) cells = line.split(';')
    else {
      // "word 中文释义" 形式，允许中英文之间用空格分隔
      const match = line.match(/^([A-Za-z][A-Za-z'’.\- ]*?)\s+([\u4e00-\u9fa5].*)$/)
      cells = match ? [match[1], match[2]] : [line]
    }

    const w = (cells[0] ?? '').trim().replace(/^"|"$/g, '')
    const meaning = (cells[1] ?? '').trim().replace(/^"|"$/g, '')
    if (!w || !meaning) continue
    // 表头与非英文行（如 "单词,释义"）直接跳过：词条必须以英文字母开头
    if (!/^[A-Za-z]/.test(w)) continue
    const t = toTransArray(meaning)
    if (t.length === 0) continue

    const key = w.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    out.push({ w, t, us: (cells[2] ?? '').trim() || undefined, uk: (cells[3] ?? '').trim() || undefined })
  }

  return out
}

/**
 * 解析用户导入的自定义词表，支持：
 *   - 本 App 导出格式 / 通用 JSON 数组：[{w,t}]、[{name,trans}]、[{word,meaning}]
 *   - CSV / TSV：word,中文释义[,美音[,英音]]
 *   - 纯文本：word 中文释义
 */
export function parseWordList(text: string, fileName = ''): { words: DictEntry[]; format: string } {
  const trimmed = text.trim()
  if (!trimmed) return { words: [], format: 'empty' }

  const looksJson = trimmed.startsWith('[') || trimmed.startsWith('{') || /\.json$/i.test(fileName)
  if (looksJson) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { words?: unknown }).words)
          ? ((parsed as { words: unknown[] }).words as unknown[])
          : Array.isArray((parsed as { data?: unknown }).data)
            ? ((parsed as { data: unknown[] }).data as unknown[])
            : []
      const words: DictEntry[] = []
      const seen = new Set<string>()
      for (const item of list) {
        if (!item || typeof item !== 'object') continue
        const entry = entryFrom(item as Record<string, unknown>)
        if (!entry) continue
        const key = entry.w.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        words.push(entry)
      }
      if (words.length > 0) return { words, format: 'json' }
    } catch {
      // 落到分隔符解析
    }
  }

  return { words: parseDelimited(text), format: 'text' }
}

/** 把词条数组导出为 JSON（用于备份/分享） */
export function serializeWords(words: DictEntry[]): string {
  return JSON.stringify(words, null, 0)
}
