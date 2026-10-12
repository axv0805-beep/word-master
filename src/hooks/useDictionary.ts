import { useEffect, useState } from 'react'
import type { BookMeta, DictEntry, Manifest } from '../core/types'
import { loadBook, loadManifest, manifestUrl } from '../core/dictionaryLoader'
import { useAppStore } from '../store/appStore'

/* 模块级缓存：切换页面不会重复请求 */
let manifestCache: Manifest | null = null
let manifestError: string | null = null
let manifestPromise: Promise<Manifest> | null = null

function fetchManifestOnce(): Promise<Manifest> {
  if (manifestCache) return Promise.resolve(manifestCache)
  if (!manifestPromise) {
    manifestPromise = loadManifest()
      .then((manifest) => {
        manifestCache = manifest
        manifestError = null
        return manifest
      })
      .catch((err: unknown) => {
        manifestError = err instanceof Error ? err.message : String(err)
        manifestPromise = null
        throw err
      })
  }
  return manifestPromise
}

export interface ManifestState {
  manifest: Manifest | null
  loading: boolean
  error: string | null
}

/** 读取内置词书清单；同时把用户导入的自定义词书合并进列表 */
export function useManifest(): ManifestState {
  const [state, setState] = useState<ManifestState>({
    manifest: manifestCache,
    loading: !manifestCache,
    error: manifestError
  })

  useEffect(() => {
    if (manifestCache) return
    let alive = true
    fetchManifestOnce()
      .then((manifest) => {
        if (alive) setState({ manifest, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (alive) {
          setState({ manifest: null, loading: false, error: err instanceof Error ? err.message : '词书清单加载失败' })
        }
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}

/** 完整词书列表：内置 + 自定义导入 */
export function useBookList(): { books: BookMeta[]; loading: boolean; error: string | null } {
  const { manifest, loading, error } = useManifest()
  const customBooks = useAppStore((state) => state.customBooks)

  const customMetas: BookMeta[] = customBooks.map((book) => {
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
  })

  return { books: [...(manifest?.books ?? []), ...customMetas], loading, error }
}

export function findBookMeta(books: BookMeta[], bookId: string): BookMeta | undefined {
  return books.find((book) => book.id === bookId)
}

export interface BookWordsState {
  words: DictEntry[]
  loading: boolean
  error: string | null
}

/** 读取某本词书的全部词条（自定义词书直接从本地存储取） */
export function useBookWords(bookId: string, books: BookMeta[]): BookWordsState {
  const customBooks = useAppStore((state) => state.customBooks)
  const [state, setState] = useState<BookWordsState>({ words: [], loading: true, error: null })

  useEffect(() => {
    let alive = true
    const custom = customBooks.find((book) => book.id === bookId)
    if (custom) {
      setState({ words: custom.words, loading: false, error: null })
      return () => {
        alive = false
      }
    }

    const meta = books.find((book) => book.id === bookId)
    if (!meta) {
      setState({ words: [], loading: false, error: `找不到词书 ${bookId}` })
      return () => {
        alive = false
      }
    }

    setState({ words: [], loading: true, error: null })
    loadBook(meta)
      .then((words) => {
        if (alive) setState({ words, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (alive) {
          setState({ words: [], loading: false, error: err instanceof Error ? err.message : '词书加载失败' })
        }
      })

    return () => {
      alive = false
    }
  }, [bookId, books, customBooks])

  return state
}

/** 直接读取若干本词书（错题专项可能跨词书） */
export async function readBooks(books: BookMeta[], bookIds: string[]): Promise<DictEntry[]> {
  const customBooks = useAppStore.getState().customBooks
  const chunks: DictEntry[][] = []
  for (const id of bookIds) {
    const custom = customBooks.find((book) => book.id === id)
    if (custom) {
      chunks.push(custom.words)
      continue
    }
    const meta = books.find((book) => book.id === id)
    if (!meta) continue
    try {
      chunks.push(await loadBook(meta))
    } catch {
      /* 单本失败不影响其它词书 */
    }
  }
  const seen = new Set<string>()
  const out: DictEntry[] = []
  for (const chunk of chunks) {
    for (const entry of chunk) {
      const key = `${entry.w.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(entry)
    }
  }
  return out
}

export { manifestUrl }
