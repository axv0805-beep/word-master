import { useEffect, useState } from 'react'
import { loadCorpus } from '../core/dictionaryLoader'
import { buildWordIndex, type WordIndex } from '../core/wordIndex'
import { useAppStore } from '../store/appStore'

let cachedIndex: WordIndex | null = null
let cachedKey = ''

/**
 * 语料库索引（全部内置词书 + 用户导入的自定义词书，去重后约 6500+ 词）。
 * 「易混词」与「词形变化」都只在词库里真实存在的词条上落地。
 */
export function useCorpus(): { index: WordIndex | null; ready: boolean } {
  const customBooks = useAppStore((state) => state.customBooks)
  const [index, setIndex] = useState<WordIndex | null>(cachedIndex)

  useEffect(() => {
    let alive = true
    loadCorpus()
      .then((builtIn) => {
        const custom = customBooks.flatMap((book) => book.words)
        const all = [...builtIn, ...custom]
        const key = `${all.length}`
        if (cachedIndex && cachedKey === key) {
          if (alive) setIndex(cachedIndex)
          return
        }
        const next = buildWordIndex(all)
        cachedIndex = next
        cachedKey = key
        if (alive) setIndex(next)
      })
      .catch(() => {
        if (alive) setIndex(null)
      })
    return () => {
      alive = false
    }
  }, [customBooks])

  return { index, ready: index !== null }
}
