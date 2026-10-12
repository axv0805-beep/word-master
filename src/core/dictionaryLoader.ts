import type { BookMeta, DictEntry, Manifest } from './types'

/** 词书基址：与 Vite base 保持一致，支持子目录部署与离线缓存 */
const DICT_BASE = './dicts/'

let manifestPromise: Promise<Manifest> | null = null
const bookCache = new Map<string, Promise<DictEntry[]>>()

function joinUrl(base: string, file: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${file}`
}

export function manifestUrl(): string {
  return joinUrl(DICT_BASE, 'manifest.json')
}

export function bookUrl(file: string): string {
  return joinUrl(DICT_BASE, file)
}

/** 读取词书清单（结果在内存中缓存） */
export function loadManifest(): Promise<Manifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(manifestUrl()).then(async (res) => {
      if (!res.ok) throw new Error(`词书清单加载失败：HTTP ${res.status}`)
      return (await res.json()) as Manifest
    })
    manifestPromise.catch(() => {
      manifestPromise = null
    })
  }
  return manifestPromise
}

/** 读取某本词书的全部词条（内存缓存，失败后允许重试） */
export function loadBook(meta: Pick<BookMeta, 'id' | 'file'>): Promise<DictEntry[]> {
  const cached = bookCache.get(meta.id)
  if (cached) return cached

  const promise = fetch(bookUrl(meta.file)).then(async (res) => {
    if (!res.ok) throw new Error(`词书 ${meta.id} 加载失败：HTTP ${res.status}`)
    const data = (await res.json()) as DictEntry[]
    if (!Array.isArray(data) || data.length === 0) throw new Error(`词书 ${meta.id} 内容为空`)
    return data.map((entry) => ({ w: entry.w, t: entry.t ?? [], us: entry.us, uk: entry.uk }))
  })

  bookCache.set(meta.id, promise)
  promise.catch(() => bookCache.delete(meta.id))
  return promise
}

/** 预取：在用户还没进入练习前把词书读进内存 */
export function prefetchBook(meta: Pick<BookMeta, 'id' | 'file'>): void {
  void loadBook(meta).catch(() => undefined)
}

let corpusPromise: Promise<DictEntry[]> | null = null

/**
 * 载入全部内置词书并去重，作为「易混词 / 词形变化」的语料库。
 * 只在第一次用到时加载，之后常驻内存（配合 Service Worker 也可离线）。
 */
export function loadCorpus(): Promise<DictEntry[]> {
  if (!corpusPromise) {
    corpusPromise = loadManifest()
      .then(async (manifest) => {
        const chunks = await Promise.all(
          manifest.books.map((book) => loadBook(book).catch(() => [] as DictEntry[]))
        )
        const seen = new Set<string>()
        const out: DictEntry[] = []
        for (const entry of chunks.flat()) {
          const key = entry.w.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          out.push(entry)
        }
        if (out.length === 0) throw new Error('语料库为空')
        return out
      })
    corpusPromise.catch(() => {
      corpusPromise = null
    })
  }
  return corpusPromise
}

/** 找出用户导入的自定义词书（保存在 localStorage，不参与内置清单） */
export const CUSTOM_BOOK_ID = 'custom'

export interface CustomBook {
  id: string
  name: string
  description: string
  words: DictEntry[]
  createdAt: number
}

export function customBookToMeta(book: CustomBook): BookMeta {
  const letters: Record<string, number> = {}
  for (const entry of book.words) {
    const letter = entry.w[0]?.toUpperCase() ?? '#'
    letters[letter] = (letters[letter] ?? 0) + 1
  }
  return {
    id: book.id,
    name: book.name,
    description: book.description,
    file: '',
    count: book.words.length,
    letters,
    phoneticRate: 0,
    source: '用户导入'
  }
}
